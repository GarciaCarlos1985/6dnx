-- ============================================================================
-- 6DNX — Conta de usuário + Fidelidade (compra cadastrada)
--
-- STATUS: VERSIONADA PORÉM NÃO APLICADA. NÃO rodar em Production sem validação
-- explícita do dono (Maycon). Aditiva: não altera nenhum dado existente, não
-- mexe no fluxo de pagamento, não marca pedido como pago.
--
-- Escopo:
--   1. Coluna commerce_orders.user_id (NULL = compra anônima; preenchido =
--      compra de cadastrado logado via Google/Discord no Supabase Auth).
--   2. Tabelas de fidelidade: loyalty_ledger (imutável / fonte da verdade),
--      loyalty_balances (cache), loyalty_balance_log (auditoria antes/depois),
--      user_profiles (dados extras do usuário, ex. Discord).
--   3. Função credit_loyalty_coins (SECURITY DEFINER, idempotente por
--      reason + source_ref) para emissões futuras EXPLICITAMENTE autorizadas.
--      Nenhum gatilho comercial é criado nesta fase.
--   4. RLS: usuário vê só o próprio; escritas só via RPC.
--
-- Referência de decisões: docs/CONTA_USUARIO_FIDELIDADE_6DNX.md
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Ligar pedido ao usuário (retrocompatível: NULL para compras antigas/anônimas)
-- ----------------------------------------------------------------------------
ALTER TABLE public.commerce_orders
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- Production recebeu a coluna numa correção emergencial anterior. Reconciliar
-- a FK de forma explícita evita que um banco limpo use NO ACTION enquanto o
-- banco real preserva pedidos históricos com ON DELETE SET NULL.
DO $$
DECLARE
  v_constraint record;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint AS c
    WHERE c.conrelid = 'public.commerce_orders'::regclass
      AND c.conname = 'commerce_orders_user_id_fkey'
      AND c.contype = 'f'
      AND c.confrelid = 'auth.users'::regclass
      AND c.confdeltype = 'n'
      AND c.conkey = ARRAY[(
        SELECT a.attnum
        FROM pg_attribute AS a
        WHERE a.attrelid = 'public.commerce_orders'::regclass
          AND a.attname = 'user_id'
      )]::smallint[]
  ) THEN
    FOR v_constraint IN
      SELECT c.conname
      FROM pg_constraint AS c
      WHERE c.conrelid = 'public.commerce_orders'::regclass
        AND c.contype = 'f'
        AND c.conkey = ARRAY[(
          SELECT a.attnum
          FROM pg_attribute AS a
          WHERE a.attrelid = 'public.commerce_orders'::regclass
            AND a.attname = 'user_id'
        )]::smallint[]
    LOOP
      EXECUTE format(
        'ALTER TABLE public.commerce_orders DROP CONSTRAINT %I',
        v_constraint.conname
      );
    END LOOP;

    ALTER TABLE public.commerce_orders
      ADD CONSTRAINT commerce_orders_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id)
      ON DELETE SET NULL
      NOT VALID;
    ALTER TABLE public.commerce_orders
      VALIDATE CONSTRAINT commerce_orders_user_id_fkey;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_orders_user
  ON public.commerce_orders(user_id);

-- Fail-closed em bancos que tenham recebido protótipos antigos: a migration
-- base nunca pode deixar crédito automático de compra ativo, nem mesmo se a
-- migration de duas carteiras ainda não tiver sido executada.
DROP TRIGGER IF EXISTS trg_credit_loyalty_on_order_paid
  ON public.commerce_orders;
DROP FUNCTION IF EXISTS public.credit_loyalty_on_order_paid();
DROP FUNCTION IF EXISTS public.credit_purchase_loyalty_coins(uuid, integer);

-- ----------------------------------------------------------------------------
-- 2a. loyalty_ledger — ledger imutável (fonte da verdade das moedas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loyalty_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    delta BIGINT NOT NULL,          -- + crédito / - débito
    reason TEXT NOT NULL,           -- 'purchase' | 'discord_activity' | 'slot_spin' | 'slot_win' ...
    source_ref TEXT,                -- order_id / id da sessão Discord / ref do giro
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_user ON public.loyalty_ledger(user_id);
-- Idempotência do crédito: um mesmo source_ref+reason só credita uma vez.
CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_source
  ON public.loyalty_ledger(user_id, reason, source_ref)
  WHERE source_ref IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 2b. loyalty_balances — saldo (cache derivado do ledger, nunca editado direto)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loyalty_balances (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    balance BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_positive_balance CHECK (balance >= 0)
);

-- ----------------------------------------------------------------------------
-- 2c. loyalty_balance_log — trilha de auditoria (antes/depois)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loyalty_balance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    previous_balance BIGINT NOT NULL,
    new_balance BIGINT NOT NULL,
    delta BIGINT NOT NULL,
    reason TEXT NOT NULL,
    source_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_balance_log_user
  ON public.loyalty_balance_log(user_id);

-- ----------------------------------------------------------------------------
-- 2d. user_profiles — dados extras do usuário (ex. Discord)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    discord_user_id TEXT,
    discord_display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. credit_loyalty_coins — única forma de creditar moedas (SECURITY DEFINER)
--    Idempotente: se (user_id, reason, source_ref) já existe, retorna o saldo
--    atual sem duplicar o crédito. Escreve ledger + balanço + log de auditoria
--    (antes/depois) numa única transação.
--    Conversão de compra: a função recebe o total de moedas a creditar já
--    calculado pelo chamador (ex. R$ -> 1 moeda por real, floor).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.credit_loyalty_coins(
  p_user_id uuid,
  p_delta bigint,
  p_reason text,
  p_source_ref text default null
)
RETURNS public.loyalty_balances
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new public.loyalty_balances;
  v_prev bigint;
BEGIN
  -- Guardas
  IF p_delta <= 0 THEN
    RAISE EXCEPTION 'delta must be positive' USING ERRCODE = '22023';
  END IF;
  IF p_reason IS NULL OR btrim(p_reason) = '' THEN
    RAISE EXCEPTION 'reason required' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.loyalty_balances (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT b.balance INTO v_prev
  FROM public.loyalty_balances AS b
  WHERE b.user_id = p_user_id
  FOR UPDATE;

  -- Idempotência: reexecuções (webhook/reconciliação) não duplicam o crédito
  IF p_source_ref IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.loyalty_ledger AS l
       WHERE l.user_id = p_user_id
         AND l.reason = p_reason
         AND l.source_ref = p_source_ref
     ) THEN
    SELECT b.* INTO v_new
    FROM public.loyalty_balances AS b
    WHERE b.user_id = p_user_id;
    RETURN v_new;
  END IF;

  -- Ledger (imutável, fonte da verdade)
  INSERT INTO public.loyalty_ledger (user_id, delta, reason, source_ref)
  VALUES (p_user_id, p_delta, p_reason, p_source_ref);

  -- Balanço (cria linha se ainda não existe)
  INSERT INTO public.loyalty_balances (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Saldo atual (antes do crédito)
  -- Aplica o crédito e devolve o novo saldo
  UPDATE public.loyalty_balances AS b
  SET balance = b.balance + p_delta, updated_at = clock_timestamp()
  WHERE b.user_id = p_user_id
  RETURNING * INTO v_new;

  -- Auditoria antes/depois (com reason/source_ref, ao contrário do trigger)
  INSERT INTO public.loyalty_balance_log
    (user_id, previous_balance, new_balance, delta, reason, source_ref)
  VALUES (p_user_id, v_prev, v_new.balance, p_delta, p_reason, p_source_ref);

  RETURN v_new;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.loyalty_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_balance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ledger próprio" ON public.loyalty_ledger;

DROP POLICY IF EXISTS "Saldo próprio" ON public.loyalty_balances;
CREATE POLICY "Saldo próprio" ON public.loyalty_balances FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Log próprio" ON public.loyalty_balance_log;

DROP POLICY IF EXISTS "Perfil próprio" ON public.user_profiles;
CREATE POLICY "Perfil próprio" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4b. RLS em commerce_orders: além do admin (is_catalog_admin, já existente),
--      o usuário autenticado lê SOMENTE os próprios pedidos. Essential para a
--      área "Minha Conta / Meus Pedidos" e proteção de dados (ninguém enxerga
--      pedido de outrem). O browser acessa via publishable key + esta policy;
--      a rota /api/account também filtra por user_id no servidor.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Usuário lê os próprios pedidos" ON public.commerce_orders;
CREATE POLICY "Usuário lê os próprios pedidos"
  ON public.commerce_orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Nenhuma policy de INSERT/UPDATE/DELETE para anon/authenticated nas tabelas
-- acima. Toda escrita passa por RPC SECURITY DEFINER.

-- O navegador não recebe as tabelas brutas de ledger/auditoria. Elas podem
-- conter metadados operacionais adicionados por migrations posteriores.
REVOKE SELECT ON public.loyalty_ledger, public.loyalty_balance_log
  FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.loyalty_ledger, public.loyalty_balances, public.loyalty_balance_log
  FROM anon, authenticated, service_role;

-- Grants e RLS são camadas independentes. O usuário autenticado continua
-- limitado à própria linha pela policy; o backend server-only recebe o
-- privilégio de tabela explicitamente, sem depender de defaults do projeto.
GRANT SELECT ON public.loyalty_balances TO authenticated, service_role;

-- Fronteira de privilégio da função de crédito
REVOKE ALL ON FUNCTION public.credit_loyalty_coins(uuid, bigint, text, text)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_loyalty_coins(uuid, bigint, text, text)
  TO service_role;

-- Não criar credit_purchase_loyalty_coins nem trigger de pedido pago nesta
-- fase. Compra, feedback e campanhas terão regras explícitas e homologadas em
-- migrations futuras; aplicar este schema jamais deve emitir moedas sozinho.
