begin;

do $$
declare
  v_offer record;
begin
  select * into v_offer
  from public.commerce_offers
  where product_source_key = 'storm-reconciliation-test'
    and variant_name = 'Teste';

  if v_offer.status <> 'approved' or v_offer.amount_cents <> 100 then
    raise exception 'published catalog offer was not approved at R$ 1,00';
  end if;

  update public.product_catalog
  set variants = '[
    {"name":"Teste","priceBRL":2},
    {"name":"Semanal","priceBRL":7}
  ]'::jsonb
  where source_key = 'storm-reconciliation-test';

  select * into v_offer
  from public.commerce_offers
  where product_source_key = 'storm-reconciliation-test'
    and variant_name = 'Teste';
  if v_offer.status <> 'approved' or v_offer.amount_cents <> 200 then
    raise exception 'catalog price change did not update the approved offer';
  end if;

  select * into v_offer
  from public.commerce_offers
  where product_source_key = 'storm-reconciliation-test'
    and variant_name = 'Semanal';
  if v_offer.status <> 'approved' or v_offer.amount_cents <> 700 then
    raise exception 'new published variant was not approved';
  end if;

  update public.product_catalog
  set variants = '[{"name":"Semanal","priceBRL":7}]'::jsonb
  where source_key = 'storm-reconciliation-test';

  select * into v_offer
  from public.commerce_offers
  where product_source_key = 'storm-reconciliation-test'
    and variant_name = 'Teste';
  if v_offer.status <> 'suspended' then
    raise exception 'removed variant remained buyable';
  end if;

  update public.product_catalog
  set publication_state = 'archived'
  where source_key = 'storm-reconciliation-test';

  select * into v_offer
  from public.commerce_offers
  where product_source_key = 'storm-reconciliation-test'
    and variant_name = 'Semanal';
  if v_offer.status <> 'suspended' then
    raise exception 'archived product remained buyable';
  end if;

  update public.product_catalog
  set publication_state = 'published'
  where source_key = 'storm-reconciliation-test';

  select * into v_offer
  from public.commerce_offers
  where product_source_key = 'storm-reconciliation-test'
    and variant_name = 'Semanal';
  if v_offer.status <> 'approved' or v_offer.amount_cents <> 700 then
    raise exception 'restored product did not restore its valid offer';
  end if;

  update public.product_catalog
  set variants = '[
    {"name":"Semanal","priceBRL":7,"availability":"sold-out"}
  ]'::jsonb
  where source_key = 'storm-reconciliation-test';

  select * into v_offer
  from public.commerce_offers
  where product_source_key = 'storm-reconciliation-test'
    and variant_name = 'Semanal';
  if v_offer.status <> 'suspended' then
    raise exception 'sold-out variant remained buyable';
  end if;

  update public.product_catalog
  set
    status = 'sold-out',
    variants = '[{"name":"Semanal","priceBRL":7}]'::jsonb
  where source_key = 'storm-reconciliation-test';

  select * into v_offer
  from public.commerce_offers
  where product_source_key = 'storm-reconciliation-test'
    and variant_name = 'Semanal';
  if v_offer.status <> 'suspended' then
    raise exception 'sold-out product remained buyable';
  end if;

  update public.product_catalog
  set status = 'available'
  where source_key = 'storm-reconciliation-test';

  select * into v_offer
  from public.commerce_offers
  where product_source_key = 'storm-reconciliation-test'
    and variant_name = 'Semanal';
  if v_offer.status <> 'approved' or v_offer.amount_cents <> 700 then
    raise exception 'available product did not restore its valid offer';
  end if;

  if has_function_privilege(
    'authenticated',
    'public.sync_catalog_commerce_offers(text)',
    'EXECUTE'
  ) then
    raise exception 'authenticated clients can execute the sync helper directly';
  end if;
end;
$$;

rollback;
