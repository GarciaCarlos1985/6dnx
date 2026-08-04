-- Keep the website catalog and the commercial checkout in one owner-controlled
-- workflow. A published product with a positive, valid BRL price is buyable;
-- archived/draft products and removed/unpriced variants are suspended.
-- Existing orders retain their immutable price snapshot.

create or replace function public.sync_catalog_commerce_offers(
  p_source_key text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_catalog record;
  v_variant jsonb;
  v_variant_name text;
  v_price_text text;
  v_amount_cents integer;
begin
  select
    catalog.source_key,
    catalog.publication_state,
    catalog.variants
  into v_catalog
  from public.product_catalog as catalog
  where catalog.source_key = p_source_key;

  if not found then
    return;
  end if;

  -- Start fail-closed. Only variants present in the current published catalog
  -- with a valid positive price are approved again below.
  update public.commerce_offers as offer
  set
    status = 'suspended',
    approval_note = 'Suspensa automaticamente pelo estado atual do catálogo.',
    approved_at = null,
    approved_by = null
  where offer.product_source_key = v_catalog.source_key;

  if v_catalog.publication_state <> 'published' then
    return;
  end if;

  for v_variant in
    select variant.value
    from jsonb_array_elements(
      coalesce(v_catalog.variants, '[]'::jsonb)
    ) as variant(value)
  loop
    v_variant_name := nullif(btrim(v_variant ->> 'name'), '');
    v_price_text := nullif(btrim(v_variant ->> 'priceBRL'), '');

    if
      v_variant_name is null
      or char_length(v_variant_name) > 120
      or v_price_text is null
      or v_price_text !~ '^[0-9]+([.][0-9]{1,2})?$'
      or (v_price_text::numeric) <= 0
      or (v_price_text::numeric) > 100000
    then
      continue;
    end if;

    v_amount_cents := round((v_price_text::numeric) * 100)::integer;

    insert into public.commerce_offers (
      product_source_key,
      variant_name,
      amount_cents,
      currency,
      status,
      approval_note,
      approved_at,
      approved_by
    )
    values (
      v_catalog.source_key,
      v_variant_name,
      v_amount_cents,
      'BRL',
      'approved',
      'Liberada automaticamente a partir do catálogo publicado.',
      clock_timestamp(),
      auth.uid()
    )
    on conflict (product_source_key, variant_name) do update
    set
      amount_cents = excluded.amount_cents,
      currency = excluded.currency,
      status = excluded.status,
      approval_note = excluded.approval_note,
      approved_at = excluded.approved_at,
      approved_by = excluded.approved_by;
  end loop;
end;
$$;

revoke all on function public.sync_catalog_commerce_offers(text)
  from public, anon, authenticated, service_role;

create or replace function public.sync_product_catalog_commerce_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.sync_catalog_commerce_offers(new.source_key);
  return new;
end;
$$;

revoke all on function public.sync_product_catalog_commerce_trigger()
  from public, anon, authenticated, service_role;

drop trigger if exists product_catalog_sync_commerce_offers
  on public.product_catalog;
create trigger product_catalog_sync_commerce_offers
after insert or update of variants, publication_state
on public.product_catalog
for each row execute function public.sync_product_catalog_commerce_trigger();

-- Bring the existing published catalog into the same rule without modifying
-- product revisions, catalog order or any existing order/payment row.
do $$
declare
  v_product record;
begin
  for v_product in
    select catalog.source_key
    from public.product_catalog as catalog
  loop
    perform public.sync_catalog_commerce_offers(v_product.source_key);
  end loop;
end;
$$;
