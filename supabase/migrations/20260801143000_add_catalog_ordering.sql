-- Safe catalog ordering for the 12-card, four-row storefront.
-- Apply manually in an isolated Supabase branch before Production.

alter table public.product_catalog
  drop constraint if exists product_catalog_pinned_items_stay_published;

create or replace function public.reorder_published_product_catalog(
  p_ordered_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  published_count integer;
  unique_count integer;
begin
  if not public.is_catalog_admin() then
    raise exception using
      errcode = '42501',
      message = 'catalog admin role required';
  end if;

  if p_ordered_ids is null
    or cardinality(p_ordered_ids) < 1
    or cardinality(p_ordered_ids) > 500
  then
    raise exception using
      errcode = '22023',
      message = 'invalid catalog order size';
  end if;

  -- Catalog publication and ordering are rare administrative writes. Taking
  -- one transaction-scoped lock closes the race between the membership check
  -- and the atomic position update without affecting public reads.
  lock table public.product_catalog in share row exclusive mode;

  select count(distinct ordered_id)
  into unique_count
  from unnest(p_ordered_ids) as ordered(ordered_id);

  if unique_count <> cardinality(p_ordered_ids) then
    raise exception using
      errcode = '22023',
      message = 'catalog order contains duplicate ids';
  end if;

  select count(*)
  into published_count
  from public.product_catalog
  where publication_state = 'published';

  if published_count <> cardinality(p_ordered_ids) then
    raise exception using
      errcode = '40001',
      message = 'published catalog changed; reload before reordering';
  end if;

  if exists (
    select 1
    from unnest(p_ordered_ids) as ordered(ordered_id)
    left join public.product_catalog as product
      on product.id = ordered.ordered_id
      and product.publication_state = 'published'
    where product.id is null
  ) then
    raise exception using
      errcode = '22023',
      message = 'catalog order contains an unavailable product';
  end if;

  update public.product_catalog as product
  set
    catalog_order = ordered.ordinality - 1,
    last_change_note = 'Ordem da vitrine atualizada no painel'
  from unnest(p_ordered_ids) with ordinality as ordered(ordered_id, ordinality)
  where product.id = ordered.ordered_id
    and product.publication_state = 'published'
    and product.catalog_order is distinct from ordered.ordinality - 1;
end;
$$;

revoke all on function public.reorder_published_product_catalog(uuid[])
  from public;
grant execute on function public.reorder_published_product_catalog(uuid[])
  to authenticated;
