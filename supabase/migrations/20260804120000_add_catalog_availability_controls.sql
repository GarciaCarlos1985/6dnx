-- Extend the owner-controlled catalog -> checkout synchronization with explicit
-- availability states. Missing variant availability remains backwards
-- compatible as "available". Unknown states fail closed.

alter table public.product_catalog
  drop constraint if exists product_catalog_status_check;
alter table public.product_catalog
  add constraint product_catalog_status_check
  check (status in ('available', 'custom', 'sold-out'));

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
  v_variant_availability text;
  v_price_text text;
  v_amount_cents integer;
begin
  select
    catalog.source_key,
    catalog.publication_state,
    catalog.status as product_status,
    catalog.variants
  into v_catalog
  from public.product_catalog as catalog
  where catalog.source_key = p_source_key;

  if not found then
    return;
  end if;

  -- Always start fail-closed. Only options that are still published, available
  -- and positively priced are approved again below.
  update public.commerce_offers as offer
  set
    status = 'suspended',
    approval_note = 'Suspensa automaticamente pelo estado atual do catálogo.',
    approved_at = null,
    approved_by = null
  where offer.product_source_key = v_catalog.source_key;

  if
    v_catalog.publication_state <> 'published'
    or v_catalog.product_status = 'sold-out'
  then
    return;
  end if;

  for v_variant in
    select variant.value
    from jsonb_array_elements(
      coalesce(v_catalog.variants, '[]'::jsonb)
    ) as variant(value)
  loop
    v_variant_name := nullif(btrim(v_variant ->> 'name'), '');
    v_variant_availability := coalesce(
      nullif(btrim(v_variant ->> 'availability'), ''),
      'available'
    );
    v_price_text := nullif(btrim(v_variant ->> 'priceBRL'), '');

    if
      v_variant_availability <> 'available'
      or v_variant_name is null
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

drop trigger if exists product_catalog_sync_commerce_offers
  on public.product_catalog;
create trigger product_catalog_sync_commerce_offers
after insert or update of variants, publication_state, status
on public.product_catalog
for each row execute function public.sync_product_catalog_commerce_trigger();

-- Reconcile existing products without touching revisions, order snapshots or
-- payment rows. Suspended offers remain stored for audit/history.
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
