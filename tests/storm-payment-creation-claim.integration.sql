-- Run only after 20260808160000_add_storm_payment_creation_claim.sql.
-- Every mutation is rolled back. No provider request is made by this test.

begin;

do $$
begin
  if not exists (
    select 1
    from public.commerce_payment_attempts
    where order_id = '20000000-0000-4000-8000-000000000001'
      and creation_state = 'ambiguous'
  ) then
    raise exception 'legacy provider-less attempt was not backfilled fail-closed';
  end if;
end;
$$;

do $$
declare
  v_catalog record;
  v_offer_id uuid := gen_random_uuid();
  v_order_id uuid := gen_random_uuid();
  v_ambiguous_order_id uuid := gen_random_uuid();
  v_legacy_writer_order_id uuid := gen_random_uuid();
  v_expired_order_id uuid := gen_random_uuid();
  v_external_id text := '6DNX-' || gen_random_uuid()::text;
  v_ambiguous_external_id text := '6DNX-' || gen_random_uuid()::text;
  v_legacy_writer_external_id text := '6DNX-' || gen_random_uuid()::text;
  v_expired_external_id text := '6DNX-' || gen_random_uuid()::text;
  v_first_claim uuid := gen_random_uuid();
  v_second_claim uuid := gen_random_uuid();
  v_result record;
begin
  select source_key, slug, title into v_catalog
  from public.product_catalog
  order by source_key
  limit 1;
  if not found then
    raise exception 'catalog fixture unavailable';
  end if;

  insert into public.commerce_offers (
    id, product_source_key, variant_name, amount_cents, status
  ) values (
    v_offer_id, v_catalog.source_key, 'TESTE CLAIM ' || v_offer_id::text,
    1099, 'draft'
  );

  insert into public.commerce_orders (
    id, client_request_id, external_id, offer_id, product_source_key,
    product_slug, product_title, variant_name, amount_cents, payer_name,
    payer_document_hash, payer_document_last4, request_fingerprint_hash,
    status
  ) values
  (
    v_order_id, gen_random_uuid(), v_external_id, v_offer_id,
    v_catalog.source_key, v_catalog.slug, v_catalog.title,
    'TESTE CLAIM', 1099, 'Teste Integracao', repeat('a', 64), '0000',
    repeat('b', 64), 'pending_payment'
  ),
  (
    v_ambiguous_order_id, gen_random_uuid(), v_ambiguous_external_id,
    v_offer_id, v_catalog.source_key, v_catalog.slug, v_catalog.title,
    'TESTE CLAIM', 1099, 'Teste Integracao', repeat('c', 64), '0000',
    repeat('d', 64), 'pending_payment'
  ),
  (
    v_legacy_writer_order_id, gen_random_uuid(), v_legacy_writer_external_id,
    v_offer_id, v_catalog.source_key, v_catalog.slug, v_catalog.title,
    'TESTE CLAIM', 1099, 'Teste Integracao', repeat('e', 64), '0000',
    repeat('f', 64), 'payment_creation_failed'
  ),
  (
    v_expired_order_id, gen_random_uuid(), v_expired_external_id,
    v_offer_id, v_catalog.source_key, v_catalog.slug, v_catalog.title,
    'TESTE CLAIM', 1099, 'Teste Integracao', repeat('1', 64), '0000',
    repeat('2', 64), 'pending_payment'
  );

  -- Simulate the old application writing during a migration-first rollout.
  insert into public.commerce_payment_attempts (
    order_id, provider, idempotency_key, last_error_code
  ) values (
    v_legacy_writer_order_id,
    'storm_wallet',
    v_legacy_writer_external_id,
    'storm-network'
  );
  if not exists (
    select 1
    from public.commerce_payment_attempts
    where order_id = v_legacy_writer_order_id
      and creation_state = 'ambiguous'
  ) then
    raise exception 'legacy writer default was not fail-closed';
  end if;

  select * into v_result
  from public.claim_storm_payment_creation(
    v_order_id, v_external_id, v_first_claim
  );
  if v_result.result_action <> 'claimed'
    or v_result.result_claim_token <> v_first_claim then
    raise exception 'first request did not win its claim';
  end if;

  select * into v_result
  from public.claim_storm_payment_creation(
    v_order_id, v_external_id, v_second_claim
  );
  if v_result.result_action <> 'waiting'
    or v_result.result_claim_token is not null then
    raise exception 'concurrent request was not held behind the winner';
  end if;

  perform public.complete_storm_payment_creation(
    v_order_id,
    v_first_claim,
    'provider-test-claim',
    'PENDENTE',
    '000201010212',
    'data:image/png;base64,iVBORw0KGgo='
  );

  select * into v_result
  from public.claim_storm_payment_creation(
    v_order_id, v_external_id, gen_random_uuid()
  );
  if v_result.result_action <> 'existing'
    or v_result.result_provider_payment_id <> 'provider-test-claim'
    or v_result.result_pix_code <> '000201010212'
    or v_result.result_qr_code <> 'data:image/png;base64,iVBORw0KGgo=' then
    raise exception 'completed claim did not return the original PIX';
  end if;

  update public.commerce_orders
  set status = 'paid'
  where id = v_order_id;
  if exists (
    select 1
    from public.commerce_payment_attempts
    where order_id = v_order_id
      and (pix_code is not null or qr_code is not null)
  ) then
    raise exception 'terminal order retained reusable PIX artifacts';
  end if;

  select * into v_result
  from public.claim_storm_payment_creation(
    v_ambiguous_order_id, v_ambiguous_external_id, v_first_claim
  );
  perform public.finish_storm_payment_creation_failure(
    v_ambiguous_order_id,
    v_first_claim,
    'ambiguous',
    'storm-ambiguous-network'
  );
  select * into v_result
  from public.claim_storm_payment_creation(
    v_ambiguous_order_id, v_ambiguous_external_id, v_second_claim
  );
  if v_result.result_action <> 'ambiguous' then
    raise exception 'ambiguous request was incorrectly released for retry';
  end if;

  select * into v_result
  from public.claim_storm_payment_creation(
    v_expired_order_id, v_expired_external_id, v_first_claim
  );
  update public.commerce_payment_attempts
  set creation_claimed_at = clock_timestamp() - interval '31 seconds'
  where order_id = v_expired_order_id;
  select * into v_result
  from public.claim_storm_payment_creation(
    v_expired_order_id, v_expired_external_id, v_second_claim
  );
  if v_result.result_action <> 'ambiguous' then
    raise exception 'expired claim did not fail closed';
  end if;

  if has_function_privilege(
    'anon',
    'public.claim_storm_payment_creation(uuid,text,uuid)',
    'EXECUTE'
  ) or has_function_privilege(
    'authenticated',
    'public.claim_storm_payment_creation(uuid,text,uuid)',
    'EXECUTE'
  ) or not has_function_privilege(
    'service_role',
    'public.claim_storm_payment_creation(uuid,text,uuid)',
    'EXECUTE'
  ) then
    raise exception 'payment claim function grants are unsafe';
  end if;
end;
$$;

rollback;
