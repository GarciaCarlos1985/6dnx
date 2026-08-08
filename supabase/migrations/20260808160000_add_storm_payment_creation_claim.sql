-- Prevent duplicate StorM PIX creation when the browser retries or two
-- requests race for the same commerce order.
--
-- This migration does not create a charge and does not change prices. It adds
-- a persistent compare-and-swap claim around the existing server-side POST.

alter table public.commerce_payment_attempts
  add column if not exists creation_state text,
  add column if not exists creation_claim_token uuid,
  add column if not exists creation_claimed_at timestamptz,
  add column if not exists pix_code text,
  add column if not exists qr_code text;

update public.commerce_payment_attempts
set creation_state = case
  when provider_payment_id is not null then 'created'
  -- A tentativa antiga pode ter expirado depois que a StorM recebeu o POST.
  -- Sem consulta por external_id documentada, liberar retry aqui poderia criar
  -- um segundo PIX. O backfill portanto falha fechado para revisão manual.
  else 'ambiguous'
end
where creation_state is null;

alter table public.commerce_payment_attempts
  -- During a migration-first rollout the old application may still insert an
  -- attempt without this column. Defaulting to ambiguous keeps that overlap
  -- fail-closed; the new RPC always writes creating/created explicitly.
  alter column creation_state set default 'ambiguous',
  alter column creation_state set not null;

alter table public.commerce_payment_attempts
  drop constraint if exists commerce_attempts_creation_state_check,
  add constraint commerce_attempts_creation_state_check
    check (creation_state in ('creating', 'created', 'ambiguous', 'failed')),
  drop constraint if exists commerce_attempts_pix_code_check,
  add constraint commerce_attempts_pix_code_check
    check (pix_code is null or char_length(pix_code) between 1 and 4096),
  drop constraint if exists commerce_attempts_qr_code_check,
  add constraint commerce_attempts_qr_code_check
    check (
      qr_code is null
      or (
        char_length(qr_code) between 1 and 500030
        and qr_code ~ '^data:image/png;base64,[A-Za-z0-9+/=]+$'
      )
    );

create or replace function public.claim_storm_payment_creation(
  p_order_id uuid,
  p_external_id text,
  p_claim_token uuid
)
returns table (
  result_action text,
  result_claim_token uuid,
  result_provider_payment_id text,
  result_provider_status text,
  result_pix_code text,
  result_qr_code text,
  result_creation_state text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.commerce_orders%rowtype;
  v_attempt public.commerce_payment_attempts%rowtype;
begin
  if p_order_id is null
    or p_claim_token is null
    or p_external_id is null
    or char_length(p_external_id) not between 1 and 100 then
    raise exception using errcode = '22023', message = 'invalid payment claim';
  end if;

  select o.* into v_order
  from public.commerce_orders as o
  where o.id = p_order_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'order not found';
  end if;
  if v_order.external_id <> p_external_id then
    raise exception using errcode = '22023', message = 'external id mismatch';
  end if;

  if v_order.status = 'paid' then
    return query select
      'paid'::text, null::uuid, null::text, null::text,
      null::text, null::text, 'created'::text;
    return;
  end if;
  if v_order.status in ('failed', 'cancelled') then
    return query select
      'terminal'::text, null::uuid, null::text, null::text,
      null::text, null::text, 'failed'::text;
    return;
  end if;

  select a.* into v_attempt
  from public.commerce_payment_attempts as a
  where a.order_id = p_order_id
  for update;

  if not found then
    insert into public.commerce_payment_attempts (
      order_id,
      provider,
      idempotency_key,
      creation_state,
      creation_claim_token,
      creation_claimed_at,
      last_error_code
    ) values (
      p_order_id,
      'storm_wallet',
      p_external_id,
      'creating',
      p_claim_token,
      clock_timestamp(),
      null
    )
    returning * into v_attempt;

    return query select
      'claimed'::text,
      v_attempt.creation_claim_token,
      v_attempt.provider_payment_id,
      v_attempt.provider_status,
      v_attempt.pix_code,
      v_attempt.qr_code,
      v_attempt.creation_state;
    return;
  end if;

  if v_attempt.idempotency_key is not null
    and v_attempt.idempotency_key <> p_external_id then
    raise exception using errcode = '22023', message = 'idempotency mismatch';
  end if;

  if v_attempt.provider_payment_id is not null then
    return query select
      'existing'::text,
      null::uuid,
      v_attempt.provider_payment_id,
      v_attempt.provider_status,
      v_attempt.pix_code,
      v_attempt.qr_code,
      v_attempt.creation_state;
    return;
  end if;

  if v_attempt.creation_state = 'ambiguous' then
    return query select
      'ambiguous'::text, null::uuid, null::text,
      v_attempt.provider_status, null::text, null::text,
      v_attempt.creation_state;
    return;
  end if;

  if v_attempt.creation_state = 'creating' then
    if v_attempt.creation_claimed_at is not null
      and v_attempt.creation_claimed_at >= clock_timestamp() - interval '30 seconds' then
      return query select
        'waiting'::text, null::uuid, null::text,
        v_attempt.provider_status, null::text, null::text,
        v_attempt.creation_state;
      return;
    end if;

    update public.commerce_payment_attempts as a
    set
      creation_state = 'ambiguous',
      creation_claim_token = null,
      creation_claimed_at = null,
      last_error_code = 'storm-claim-expired',
      updated_at = clock_timestamp()
    where a.order_id = p_order_id
    returning * into v_attempt;

    return query select
      'ambiguous'::text, null::uuid, null::text,
      v_attempt.provider_status, null::text, null::text,
      v_attempt.creation_state;
    return;
  end if;

  -- Only a deterministic provider rejection reaches `failed`. It may be
  -- retried with the same order/external id after winning a new atomic claim.
  update public.commerce_payment_attempts as a
  set
    idempotency_key = p_external_id,
    creation_state = 'creating',
    creation_claim_token = p_claim_token,
    creation_claimed_at = clock_timestamp(),
    last_error_code = null,
    updated_at = clock_timestamp()
  where a.order_id = p_order_id
  returning * into v_attempt;

  update public.commerce_orders as o
  set status = 'pending_payment', updated_at = clock_timestamp()
  where o.id = p_order_id and o.status = 'payment_creation_failed';

  return query select
    'claimed'::text,
    v_attempt.creation_claim_token,
    v_attempt.provider_payment_id,
    v_attempt.provider_status,
    v_attempt.pix_code,
    v_attempt.qr_code,
    v_attempt.creation_state;
end;
$$;

create or replace function public.complete_storm_payment_creation(
  p_order_id uuid,
  p_claim_token uuid,
  p_provider_payment_id text,
  p_provider_status text,
  p_pix_code text,
  p_qr_code text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.commerce_orders%rowtype;
  v_attempt public.commerce_payment_attempts%rowtype;
begin
  if p_order_id is null
    or p_claim_token is null
    or p_provider_payment_id is null
    or char_length(p_provider_payment_id) not between 1 and 160
    or p_provider_status not in ('PENDENTE', 'COMPLETO', 'FALHA')
    or p_pix_code is null
    or char_length(p_pix_code) not between 1 and 4096
    or p_qr_code is null
    or char_length(p_qr_code) not between 1 and 500030
    or p_qr_code !~ '^data:image/png;base64,[A-Za-z0-9+/=]+$' then
    raise exception using errcode = '22023', message = 'invalid payment result';
  end if;

  select o.* into v_order
  from public.commerce_orders as o
  where o.id = p_order_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'order not found';
  end if;

  select a.* into v_attempt
  from public.commerce_payment_attempts as a
  where a.order_id = p_order_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'payment claim not found';
  end if;

  if v_attempt.provider_payment_id is not null then
    if v_attempt.provider_payment_id <> p_provider_payment_id then
      raise exception using errcode = '22023', message = 'provider id mismatch';
    end if;
    return;
  end if;

  if v_attempt.creation_state <> 'creating'
    or v_attempt.creation_claim_token is distinct from p_claim_token then
    raise exception using errcode = '55000', message = 'payment claim not owned';
  end if;

  update public.commerce_payment_attempts as a
  set
    provider_payment_id = p_provider_payment_id,
    provider_status = p_provider_status,
    creation_state = 'created',
    creation_claim_token = null,
    creation_claimed_at = null,
    pix_code = case
      when v_order.status in ('paid', 'failed', 'cancelled') then null
      else p_pix_code
    end,
    qr_code = case
      when v_order.status in ('paid', 'failed', 'cancelled') then null
      else p_qr_code
    end,
    last_error_code = null,
    updated_at = clock_timestamp()
  where a.order_id = p_order_id;

  if p_provider_status = 'FALHA' then
    update public.commerce_orders as o
    set status = 'failed', updated_at = clock_timestamp()
    where o.id = p_order_id and o.status <> 'paid';
  elsif v_order.status = 'payment_creation_failed' then
    update public.commerce_orders as o
    set status = 'pending_payment', updated_at = clock_timestamp()
    where o.id = p_order_id;
  end if;
end;
$$;

create or replace function public.finish_storm_payment_creation_failure(
  p_order_id uuid,
  p_claim_token uuid,
  p_outcome text,
  p_error_code text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.commerce_orders%rowtype;
  v_attempt public.commerce_payment_attempts%rowtype;
begin
  if p_order_id is null
    or p_claim_token is null
    or p_outcome not in ('failed', 'ambiguous')
    or p_error_code is null
    or char_length(p_error_code) not between 1 and 80 then
    raise exception using errcode = '22023', message = 'invalid payment failure';
  end if;

  -- Preserve the same lock order used by claim/complete: order, then attempt.
  -- Opposite ordering can deadlock a deterministic failure racing a retry.
  select o.* into v_order
  from public.commerce_orders as o
  where o.id = p_order_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'order not found';
  end if;

  select a.* into v_attempt
  from public.commerce_payment_attempts as a
  where a.order_id = p_order_id
  for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'payment claim not found';
  end if;

  if v_attempt.provider_payment_id is not null then
    return;
  end if;
  if v_attempt.creation_state <> 'creating'
    or v_attempt.creation_claim_token is distinct from p_claim_token then
    raise exception using errcode = '55000', message = 'payment claim not owned';
  end if;

  update public.commerce_payment_attempts as a
  set
    creation_state = p_outcome,
    creation_claim_token = null,
    creation_claimed_at = null,
    last_error_code = p_error_code,
    updated_at = clock_timestamp()
  where a.order_id = p_order_id;

  if p_outcome = 'failed' then
    update public.commerce_orders as o
    set status = 'payment_creation_failed', updated_at = clock_timestamp()
    where o.id = p_order_id
      and o.status in ('pending_payment', 'payment_creation_failed');
  end if;
end;
$$;

create or replace function public.clear_storm_pix_artifacts()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('paid', 'failed', 'cancelled')
    and old.status is distinct from new.status then
    update public.commerce_payment_attempts as a
    set
      pix_code = null,
      qr_code = null,
      creation_claim_token = null,
      creation_claimed_at = null,
      updated_at = clock_timestamp()
    where a.order_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists commerce_orders_clear_storm_pix_artifacts
  on public.commerce_orders;
create trigger commerce_orders_clear_storm_pix_artifacts
after update of status on public.commerce_orders
for each row execute function public.clear_storm_pix_artifacts();

revoke all on function public.claim_storm_payment_creation(uuid, text, uuid)
  from public, anon, authenticated;
revoke all on function public.complete_storm_payment_creation(
  uuid, uuid, text, text, text, text
) from public, anon, authenticated;
revoke all on function public.finish_storm_payment_creation_failure(
  uuid, uuid, text, text
) from public, anon, authenticated;
revoke all on function public.clear_storm_pix_artifacts()
  from public, anon, authenticated;

grant execute on function public.claim_storm_payment_creation(uuid, text, uuid)
  to service_role;
grant execute on function public.complete_storm_payment_creation(
  uuid, uuid, text, text, text, text
) to service_role;
grant execute on function public.finish_storm_payment_creation_failure(
  uuid, uuid, text, text
) to service_role;
