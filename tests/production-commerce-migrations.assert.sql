do $$
declare
  v_expected integer;
  v_approved integer;
  v_unmatched integer;
  v_before record;
begin
  select count(*) into v_expected
  from public.product_catalog as catalog
  cross join lateral jsonb_array_elements(catalog.variants) as variant(value)
  where catalog.publication_state = 'published'
    and nullif(btrim(variant.value ->> 'name'), '') is not null
    and (variant.value ->> 'priceBRL') ~ '^[0-9]+([.][0-9]{1,2})?$'
    and ((variant.value ->> 'priceBRL')::numeric) > 0
    and ((variant.value ->> 'priceBRL')::numeric) <= 100000;

  select count(*) into v_approved
  from public.commerce_offers
  where status = 'approved';

  if v_approved <> v_expected then
    raise exception
      'approved offer count % differs from expected %',
      v_approved,
      v_expected;
  end if;

  select count(*) into v_unmatched
  from public.commerce_offers as offer
  where offer.status = 'approved'
    and not exists (
      select 1
      from public.product_catalog as catalog
      cross join lateral jsonb_array_elements(catalog.variants)
        as variant(value)
      where catalog.source_key = offer.product_source_key
        and catalog.publication_state = 'published'
        and variant.value ->> 'name' = offer.variant_name
        and round(
          ((variant.value ->> 'priceBRL')::numeric) * 100
        )::integer = offer.amount_cents
    );

  if v_unmatched <> 0 then
    raise exception
      'found % approved offers outside the published priced catalog',
      v_unmatched;
  end if;

  select * into v_before from before_commerce_counts;
  if (select count(*) from public.commerce_orders) <> v_before.orders
    or (
      select count(*) from public.commerce_payment_attempts
    ) <> v_before.attempts
    or (
      select count(*) from public.commerce_webhook_events
    ) <> v_before.webhooks
  then
    raise exception 'migration changed order/payment/event history';
  end if;

  if to_regclass('public.commerce_reconciliation_events') is null then
    raise exception 'reconciliation table missing';
  end if;
end;
$$;
