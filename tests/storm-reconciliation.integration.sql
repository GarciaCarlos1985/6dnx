begin;

insert into public.commerce_orders (
  id,
  client_request_id,
  external_id,
  offer_id,
  product_source_key,
  product_slug,
  product_title,
  variant_name,
  amount_cents,
  payer_name,
  payer_document_hash,
  payer_document_last4,
  request_fingerprint_hash
)
select
  '00000000-0000-4000-8000-000000000001'::uuid,
  '00000000-0000-4000-8000-000000000002'::uuid,
  '6DNX-integration-paid',
  o.id,
  o.product_source_key,
  'test-product',
  'Produto de teste',
  o.variant_name,
  o.amount_cents,
  'Cliente Teste',
  repeat('a', 64),
  '0001',
  repeat('b', 64)
from public.commerce_offers as o
where o.product_source_key = 'storm-reconciliation-test'
  and o.variant_name = 'Teste';

insert into public.commerce_payment_attempts (
  order_id,
  provider_payment_id,
  idempotency_key,
  provider_status
)
values (
  '00000000-0000-4000-8000-000000000001',
  'payment-integration-paid',
  '6DNX-integration-paid',
  'PENDENTE'
);

do $$
declare
  v_count integer;
  v_result record;
begin
  select count(*) into v_count
  from public.list_storm_reconciliation_candidates(100);
  if v_count <> 1 then
    raise exception 'expected one bounded reconciliation candidate, got %', v_count;
  end if;

  select * into v_result
  from public.reconcile_storm_payment(
    repeat('c', 64),
    'payment-integration-paid',
    '6DNX-integration-paid',
    100,
    'COMPLETO',
    clock_timestamp()
  );
  if v_result.order_status <> 'paid'
    or not v_result.reconciliation_inserted
    or not v_result.payment_transitioned then
    raise exception 'first reconciliation did not transition exactly once';
  end if;

  select * into v_result
  from public.reconcile_storm_payment(
    repeat('c', 64),
    'payment-integration-paid',
    '6DNX-integration-paid',
    100,
    'COMPLETO',
    clock_timestamp()
  );
  if v_result.order_status <> 'paid'
    or v_result.reconciliation_inserted
    or v_result.payment_transitioned then
    raise exception 'duplicate reconciliation was not idempotent';
  end if;

  select * into v_result
  from public.process_storm_payment_event_v2(
    repeat('d', 64),
    'payment.completed',
    'payment-integration-paid',
    '6DNX-integration-paid',
    100,
    'COMPLETO',
    clock_timestamp()
  );
  if not v_result.event_inserted or v_result.payment_transitioned then
    raise exception 'late webhook duplicated the paid transition';
  end if;

  select count(*) into v_count
  from public.list_storm_reconciliation_candidates(10);
  if v_count <> 0 then
    raise exception 'paid order remained in reconciliation queue';
  end if;

  if (
    select count(*)
    from public.commerce_reconciliation_events
    where order_id = '00000000-0000-4000-8000-000000000001'
  ) <> 1 then
    raise exception 'reconciliation evidence was not unique';
  end if;

  if has_function_privilege(
    'anon',
    'public.reconcile_storm_payment(text,text,text,integer,text,timestamptz)',
    'EXECUTE'
  ) then
    raise exception 'anon can execute reconciliation';
  end if;
  if has_function_privilege(
    'authenticated',
    'public.reconcile_storm_payment(text,text,text,integer,text,timestamptz)',
    'EXECUTE'
  ) then
    raise exception 'authenticated can execute reconciliation';
  end if;
  if not has_function_privilege(
    'service_role',
    'public.reconcile_storm_payment(text,text,text,integer,text,timestamptz)',
    'EXECUTE'
  ) then
    raise exception 'service_role cannot execute reconciliation';
  end if;
  if not (
    select c.relrowsecurity
    from pg_class as c
    inner join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'commerce_reconciliation_events'
  ) then
    raise exception 'reconciliation evidence table has no RLS';
  end if;
end;
$$;

do $$
begin
  perform public.reconcile_storm_payment(
    repeat('e', 64),
    'payment-integration-paid',
    '6DNX-integration-paid',
    101,
    'COMPLETO',
    clock_timestamp()
  );
  raise exception 'amount mismatch was accepted';
exception
  when sqlstate '22023' then
    null;
end;
$$;

rollback;
