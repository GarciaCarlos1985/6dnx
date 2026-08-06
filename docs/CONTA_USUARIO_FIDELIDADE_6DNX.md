# 6DNX — Conta de usuário + Fidelidade + Integração com Slot Engine

> **Status:** proposta de arquitetura (rascunho para validação do Maycon).
> Nada aqui foi aplicado em banco, commitado ou publicado. A base de login
> social (Google/Discord) já está implementada no hero; este documento define
> **o que fazer com a identidade conectada**.

## Objetivo de negócio (confirmado com o dono)

1. **Compra continua permitida para visitante anônimo.** Não obrigar cadastro
   para comprar — preserva a fricção baixa e não perde comprador.
2. **Cadastro oferece benefícios.** Ganhar moedas de fidelidade por compras
   feitas ou por tempo conectado ao canal do Discord.
3. **Slot engine exige cadastro.** Só usuário registrado participa do giro.
4. **Histórico completo de usuários** para: controle de contabilidade,
   relatórios de vendas, balanço e recuperação de banco de dados caso o Discord
   ou o site caiam.

## Princípio central da arquitetura

> **Compra anônima e compra cadastrada NÃO são fluxos separados. É o MESMO
> fluxo de checkout — a diferença é apenas se o pedido fica ligado a um
> `user_id`.**

Isso evita dois caminhos de compra duplicados (e toda a duplicação de bug e
manutenção que isso traria). O checkout atual permanece intacto; a única adição
é capturar o `user_id` da sessão do Supabase quando o comprador está logado.

## Modelo de identidade

- **Fonte de cadastro = `auth.users` do Supabase** (criado automaticamente pelo
  login Google/Discord). Não criamos tabela de usuário à parte.
- Toda tabela de domínio que precisa de dono carrega `user_id uuid`.
- Compra anônima grava `user_id = NULL`. Compra logada grava o `auth.uid()`.
- **Separação de papéis:** visitante logado tem `app_metadata.role` vazio/
  ausente; somente o admin possui `role: admin` (já validado em
  `lib/admin/auth.ts`). Logo, **nenhum login social concede acesso ao painel**
  — a proteção existente não precisa mudar.

## Tabelas novas (migration versionada, NÃO aplicada)

### 1. `commerce_orders.user_id` (coluna nova)
```sql
ALTER TABLE public.commerce_orders
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_orders_user
  ON public.commerce_orders(user_id);
```
- `NULL` = compra anônima; preenchido = compra de cadastrado.

### 2. `loyalty_ledger` — ledger imutável (fonte da verdade das moedas)
```sql
CREATE TABLE IF NOT EXISTS public.loyalty_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    delta BIGINT NOT NULL,          -- + crédito / - débito
    reason TEXT NOT NULL,           -- 'purchase' | 'discord_activity' | 'slot_spin' | 'slot_win' ...
    source_ref TEXT,                -- order_id / discord session / ref do giro
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON public.loyalty_ledger(user_id);
```

### 3. `loyalty_balances` — saldo (cache derivado do ledger)
```sql
CREATE TABLE IF NOT EXISTS public.loyalty_balances (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    balance BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_positive_balance CHECK (balance >= 0)
);
```
Invariante: `balance = SUM(delta)` do ledger. Cron de reconciliação compara e
alerta divergência.

### 4. `loyalty_balance_log` — trilha de auditoria de mudanças de saldo
```sql
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
```
> Registrar o **antes/depois** do saldo é o que embasa contabilidade e
> recuperação: permite reconstruir qualquer estado a partir do log.

### 5. `user_profiles` — dados de fidelidade do usuário (ID do Discord, etc.)
```sql
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    discord_user_id TEXT,           -- proveniente do OAuth Discord
    discord_display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Regra de moedas por compra (a decisão central)

**Decisão sugerida (V1 – simples):** moedas só se o comprador estava **logado
no momento da compra**. Compras anônimas não geram moedas e não há reivindicação
retroativa (evita fraude e complexidade).

- Taxa: ex. **R$ 1,00 = 1 moeda** (configurável). Pedido de R$ 21,99 → 21 moedas
  (arredondamento definido, ex. `floor`).
- Disparo: **somente quando o pedido transiciona para `paid`** (via
  webhook/reconciliação — nunca antes do pagamento confirmar).
- Idempotente: o crédito usa `source_ref = order_id` e não duplica se o
  webhook/reconciliação reexecutar.

**V2 (futura, não no escopo agora):** pedido anônimo guarda um link de
reivindicação; ao logar, o usuário anexa o pedido e recebe as moedas.

## Slot engine (integração)

O escopo completo está em `slot-engine-arquitetura-2.md` (schema com `site_id`,
ledger, RNG provably fair, rate limit, RLS). Este documento **não redefine**;
apenas estabelece a ponte:

- Toda tabela do slot referencia `user_id` (que é o `auth.uid()` de um usuário
  cadastrado). **Não há slot anônimo.**
- O crédito de moedas de compra (`reason='purchase'`) e o jogo (`spin_slot`)
  operam **no mesmo `loyalty_ledger`** — moeda única, compartilhada.
- O `site_id` do slot para o 6DNX é uma constante (ex. `'6dnx'`); a fidelidade
  deste documento pode assumir o mesmo `site_id` quando o slot for integrado,
  mantendo o ledger único por usuário.

## Relatórios, contabilidade e recuperação (parte b)

### Segregação de "moedas"
- **Ledger de vendas = `commerce_orders`** (R$ reais) — receita, balanço.
- **Ledger de fidelidade = `loyalty_ledger`** (moeda fechada) — valor interno,
  **sem qualquer caminho de saque para R$**. Essa separação estrutural sustenta
  o argumento de "moeda fechada, não é aposta".

### Relatórios de vendas / balanço
- Base: `commerce_orders` (pedidos pagos, valores, produtos) somado ao
  `user_id` para repartição por cliente quando disponível.
- Moedas emitidas: `SUM(delta) WHERE reason='purchase'` no ledger = total de
  moedas distribuídas (custo do programa de fidelidade).
- Sugestão de views SQL (`v_sales_summary`, `v_loyalty_issuance`) para os
  relatórios — documentadas aqui, materializadas em migration posterior.

### Backup e recuperação de banco
- **Problema:** Supabase Free **não tem** Point-in-Time Recovery (PITR) — é
  plano pago.
- **Solução proposta:** cron periódico que exporta as tabelas críticas
  (`auth` de usuários não é exportável por SQL direto, mas podemos exportar
  `user_profiles`, `loyalty_ledger`, `loyalty_balance_log`, `commerce_orders`,
  `loyalty_balances`) para um bucket privado / armazenamento externo (ex. via
  `service_role` em RPC dedicada que despeja JSONL, gravado em bucket Supabase
  privado ou exportação local).
- **Garantia:** com `loyalty_ledger` + `loyalty_balance_log`, qualquer saldo é
  reconstruível a partir do log — mesmo se a tabela de cache for perdida.

## RLS (segurança por linha)

```sql
ALTER TABLE public.loyalty_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_balance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Usuário vê só o próprio
CREATE POLICY "Ledger próprio" ON public.loyalty_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Saldo próprio" ON public.loyalty_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Log próprio" ON public.loyalty_balance_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Perfil próprio" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
```
Toda escrita passa por funções RPC `SECURITY DEFINER` (ex.
`credit_loyalty_coins`, `attach_order_to_user`); **nenhuma policy de
INSERT/UPDATE/DELETE** para `anon`/`authenticated` direto.

## Pontos em aberto (decisão do dono)

1. **Taxa de conversão de moedas por compra** (ex. R$ 1 = 1 moeda; ajustável).
2. **Arredondamento** (floor / arredondar / teto).
3. **Reivindicação retroativa v1 vs v2** (sugerida: não na v1).
4. **Regra do Discord** (tempo conectado → moedas): ainda não parametrizada;
   requer integração com o bot no servidor.
5. **Regulatório do slot** — fora deste doc (já apontado no
   `slot-engine-arquitetura-2.md`): confirmar enquadramento com advogado.

## Fases de implementação

1. **Base (este trabalho):** migration versionada (não aplicada), coluna
   `user_id` em `commerce_orders`, tabelas de fidelidade, função de crédito
   idempotente, e captura do `user_id` no checkout.
2. **Crédito de moedas na compra paga:** disparar `credit_loyalty_coins` quando
   o pedido virar `paid` (source_ref = order_id), idempotente.
3. **UI de saldo:** mostrar saldo de moedas no hero quando logado.
4. **Discord activity** e **slot engine:** camadas futuras.

## Validações deste documento

- Nenhuma migration aplicada, nenhum commit, nenhum push, nenhum deploy.
- Código novo é additivo e não toca no fluxo de pagamento existente.
