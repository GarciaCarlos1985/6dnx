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
--      reason + source_ref) — migra a compra paga em moedas de fidelidade.
--   4. RLS: usuário vê só o próprio; escritas só via RPC.
--
-- Referência de decisões: docs/CONTA_USUARIO_FIDELIDADE_6DNX.md
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Ligar pedido ao usuário (retrocompatível: NULL para compras antigas/anônimas)
-- ----------------------------------------------------------------------------
ALTER TABLE public.commerce_orders
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_orders_user
  ON public.commerce_orders(user_id);

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

  -- Idempotência: reexecuções (webhook/reconciliação) não duplicam o crédito
  IF p_source_ref IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.loyalty_ledger AS l
       WHERE l.user_id = p_user_id
         AND l.reason = p_reason
         AND l.source_ref = p_source_ref
     ) THEN
    RETURN (SELECT b.* FROM public.loyalty_balances AS b WHERE b.user_id = p_user_id);
  END IF;

  -- Ledger (imutável, fonte da verdade)
  INSERT INTO public.loyalty_ledger (user_id, delta, reason, source_ref)
  VALUES (p_user_id, p_delta, p_reason, p_source_ref);

  -- Balanço (cria linha se ainda não existe)
  INSERT INTO public.loyalty_balances (user_id, balance)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Saldo atual (antes do crédito)
  SELECT balance INTO v_prev
  FROM public.loyalty_balances
  WHERE user_id = p_user_id;

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
CREATE POLICY "Ledger próprio" ON public.loyalty_ledger FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Saldo próprio" ON public.loyalty_balances;
CREATE POLICY "Saldo próprio" ON public.loyalty_balances FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Log próprio" ON public.loyalty_balance_log;
CREATE POLICY "Log próprio" ON public.loyalty_balance_log FOR SELECT USING (auth.uid() = user_id);

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

-- Fronteira de privilégio da função de crédito
REVOKE ALL ON FUNCTION public.credit_loyalty_coins(uuid, bigint, text, text)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_loyalty_coins(uuid, bigint, text, text)
  TO service_role;

-- ----------------------------------------------------------------------------
-- 3b. credit_purchase_loyalty_coins — credita moedas por UMA compra paga.
--      Só age quando: pedido está paid E tem user_id (compra cadastrada).
--      Compra anônima (user_id NULL) não gera moeda. Idempotente por
--      source_ref = order_id.
--      Conversão padrão: 1 BRL = 1 moeda, arredondando para baixo
--      (R$ 21,99 -> 21 moedas). Taxa configurável via parâmetro.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.credit_purchase_loyalty_coins(
  p_order_id uuid,
  p_brl_to_coins int default 1
)
RETURNS TABLE (
  applied boolean,
  coins bigint,
  balance bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order public.commerce_orders%rowtype;
  v_coins bigint;
  v_balance public.loyalty_balances;
BEGIN
  IF p_brl_to_coins <= 0 THEN
    RAISE EXCEPTION 'invalid conversion rate' USING ERRCODE = '22023';
  END IF;

  SELECT o.* INTO v_order
  FROM public.commerce_orders AS o
  WHERE o.id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order not found' USING ERRCODE = 'P0002';
  END IF;

  -- Moedas só para compra paga E cadastrada
  IF v_order.user_id IS NULL OR v_order.status <> 'paid' THEN
    RETURN QUERY SELECT false, 0::bigint, 0::bigint;
    RETURN;
  END IF;

  v_coins := floor(v_order.amount_cents::numeric / 100)::bigint * p_brl_to_coins;
  IF v_coins <= 0 THEN
    RETURN QUERY SELECT false, 0::bigint, 0::bigint;
    RETURN;
  END IF;

  v_balance := public.credit_loyalty_coins(
    v_order.user_id,
    v_coins,
    'purchase',
    v_order.id::text
  );

  RETURN QUERY SELECT true, v_coins, v_balance.balance;
END;
$$;

REVOKE ALL ON FUNCTION public.credit_purchase_loyalty_coins(uuid, int)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_purchase_loyalty_coins(uuid, int)
  TO service_role;

-- ----------------------------------------------------------------------------
-- 3c. Trigger de integração automática: quando commerce_orders.status passa a
--     'paid' E o pedido tem user_id, credita automaticamente as moedas da
--     compra. Idempotente (credit_loyalty_coins usa source_ref = order_id).
--     Não exige mudança nenhuma no fluxo de pagamento/cobrança existente.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.credit_loyalty_on_order_paid()
RETURNS TRIGGER AS $$
BEGIN
  -- Só na transição para paid e só para pedido cadastrado
  IF NEW.status = 'paid'
     AND (OLD.status IS DISTINCT FROM 'paid')
     AND NEW.user_id IS NOT NULL THEN
    PERFORM public.credit_purchase_loyalty_coins(NEW.id, 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP TRIGGER IF EXISTS trg_credit_loyalty_on_order_paid
  ON public.commerce_orders;
CREATE TRIGGER trg_credit_loyalty_on_order_paid
  AFTER UPDATE OF status ON public.commerce_orders
  FOR EACH ROW EXECUTE FUNCTION public.credit_loyalty_on_order_paid();
