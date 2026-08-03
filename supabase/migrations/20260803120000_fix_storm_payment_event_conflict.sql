-- ============================================================================
-- Correção aditiva da RPC process_storm_payment_event
--
-- CAUSA RAIZ (medida em produção, 2026-08-03):
--   PostgreSQL 42702 / HTTP 422.
--   A função declara `returns table (order_id uuid, ...)`. Esse nome de coluna
--   de saída entra no escopo do PL/pgSQL como variável. Quando o corpo executa
--   `on conflict (order_id)`, o PL/pgSQL não consegue decidir entre a coluna
--   real de commerce_payment_attempts e a variável de saída homônima, e aborta
--   com "column reference order_id is ambiguous".
--
-- CORREÇÃO MÍNIMA:
--   Trocar a inferência por coluna pela referência explícita à constraint:
--     on conflict (order_id)                          -- ambíguo
--     on conflict on constraint commerce_payment_attempts_pkey  -- determinístico
--   `commerce_payment_attempts.order_id` é `uuid primary key`, portanto a
--   constraint implícita é `commerce_payment_attempts_pkey` e cobre exatamente
--   a mesma coluna. O comportamento de upsert é idêntico; muda só a forma de
--   identificar o conflito, que deixa de passar pela resolução de nomes.
--
-- ESTA MIGRATION É ADITIVA E IDEMPOTENTE:
--   Usa `create or replace function`. Não altera tabela, coluna, índice,
--   constraint, dado, RLS ou grant. Não toca em nenhum pedido existente.
--   Não marca nada como pago. O único caminho que pode produzir `paid` continua
--   sendo um webhook com HMAC válido processado por esta função.
--
-- PRÉ-CONDIÇÃO DE APLICAÇÃO:
--   Rodar antes, na mesma sessão, dentro de BEGIN ... ROLLBACK, para conferir
--   que o pedido real do teste passa de `pending_payment` para `paid` e insere
--   exatamente um evento. Só depois aplicar de verdade. Ver o roteiro em
--   docs/PLANO_FINALIZACAO_6DNX.md, Fase 1.
-- ============================================================================

create or replace function public.process_storm_payment_event(
  p_event_key text,
  p_event_name text,
  p_provider_payment_id text,
  p_external_id text,
  p_amount_cents integer,
  p_provider_status text,
  p_completed_at timestamptz default null
)
returns table (
  order_id uuid,
  product_slug text,
  product_title text,
  variant_name text,
  amount_cents integer,
  order_status text,
  event_inserted boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_order public.commerce_orders%rowtype;
  v_attempt public.commerce_payment_attempts%rowtype;
  v_inserted boolean := false;
  v_row_count integer := 0;
begin
  if p_event_name not in ('payment.completed', 'payment.failed')
    or p_provider_status not in ('COMPLETO', 'FALHA')
    or (p_event_name = 'payment.completed' and p_provider_status <> 'COMPLETO')
    or (p_event_name = 'payment.failed' and p_provider_status <> 'FALHA') then
    raise exception using errcode = '22023', message = 'invalid storm event';
  end if;

  select o.* into v_order
  from public.commerce_orders as o
  where o.external_id = p_external_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'order not found';
  end if;
  v_order_id := v_order.id;
  if v_order.amount_cents <> p_amount_cents then
    raise exception using errcode = '22023', message = 'amount mismatch';
  end if;

  select a.* into v_attempt
  from public.commerce_payment_attempts as a
  where a.order_id = v_order.id
  for update;
  if found
    and v_attempt.provider_payment_id is not null
    and v_attempt.provider_payment_id <> p_provider_payment_id then
    raise exception using errcode = '22023', message = 'provider id mismatch';
  end if;

  insert into public.commerce_webhook_events (
    event_key,
    order_id,
    event_name,
    provider_payment_id,
    external_id,
    amount_cents,
    provider_status
  )
  values (
    p_event_key,
    v_order.id,
    p_event_name,
    p_provider_payment_id,
    p_external_id,
    p_amount_cents,
    p_provider_status
  )
  on conflict do nothing;
  get diagnostics v_row_count = row_count;
  v_inserted := v_row_count > 0;

  if v_inserted then
    insert into public.commerce_payment_attempts (
      order_id,
      provider,
      provider_payment_id,
      idempotency_key,
      provider_status,
      provider_complete_observed_at,
      updated_at
    )
    values (
      v_order.id,
      'storm_wallet',
      p_provider_payment_id,
      v_order.external_id,
      p_provider_status,
      case when p_provider_status = 'COMPLETO' then clock_timestamp() end,
      clock_timestamp()
    )
    -- CORREÇÃO: era `on conflict (order_id) do update`, que colidia com a
    -- coluna de saída homônima da função e gerava PostgreSQL 42702.
    on conflict on constraint commerce_payment_attempts_pkey do update
    set
      provider_payment_id = excluded.provider_payment_id,
      idempotency_key = excluded.idempotency_key,
      provider_status = case
        when public.commerce_payment_attempts.provider_status = 'COMPLETO'
          then public.commerce_payment_attempts.provider_status
        else excluded.provider_status
      end,
      provider_complete_observed_at = coalesce(
        public.commerce_payment_attempts.provider_complete_observed_at,
        excluded.provider_complete_observed_at
      ),
      updated_at = clock_timestamp();

    if p_provider_status = 'COMPLETO' then
      update public.commerce_orders as o
      set
        status = 'paid',
        paid_at = coalesce(o.paid_at, p_completed_at, clock_timestamp()),
        updated_at = clock_timestamp()
      where o.id = v_order.id
        and o.status in ('pending_payment', 'payment_creation_failed', 'failed');
    elsif p_provider_status = 'FALHA' then
      update public.commerce_orders as o
      set status = 'failed', updated_at = clock_timestamp()
      where o.id = v_order.id and o.status <> 'paid';
    end if;
  end if;

  select o.* into v_order
  from public.commerce_orders as o
  where o.id = v_order_id;

  return query select
    v_order.id,
    v_order.product_slug,
    v_order.product_title,
    v_order.variant_name,
    v_order.amount_cents,
    v_order.status,
    v_inserted;
end;
$$;

-- Reafirma a fronteira de privilégio. `create or replace` preserva os grants
-- existentes, mas repetir aqui torna a migration autossuficiente e auditável.
revoke all on function public.process_storm_payment_event(
  text, text, text, text, integer, text, timestamptz
) from public, anon, authenticated;

grant execute on function public.process_storm_payment_event(
  text, text, text, text, integer, text, timestamptz
) to service_role;
