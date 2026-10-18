-- Explicit publication of reviewed drafts. Existing products and commerce are
-- unchanged. Uses the same table lock as the existing ordering operation.
create or replace function public.admin_publish_catalog_product(
  p_product_id uuid,
  p_expected_revision integer
)
returns public.product_catalog
language plpgsql
security invoker
set search_path = ''
as $$
declare
  product public.product_catalog;
  next_position integer;
begin
  if auth.uid() is null or not public.is_catalog_admin() then
    raise exception using errcode = '42501', message = 'catalog admin required';
  end if;
  if p_product_id is null or p_expected_revision is null or p_expected_revision < 1 then
    raise exception using errcode = '22023', message = 'invalid publication request';
  end if;
  lock table public.product_catalog in share row exclusive mode;
  select * into product from public.product_catalog where id = p_product_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'product not found';
  end if;
  if product.revision <> p_expected_revision then
    raise exception using errcode = '40001', message = 'product revision conflict';
  end if;
  if product.publication_state = 'published' then return product; end if;
  if product.publication_state <> 'draft'
    or btrim(product.description) = ''
    or product.image = '/products/product-placeholder.svg'
    or not exists (
      select 1 from jsonb_array_elements(product.variants) as entry
      where coalesce(entry->>'availability', 'available') <> 'archived'
        and coalesce(btrim(entry->>'name'), '') <> ''
    ) then
    raise exception using errcode = '22023', message = 'product is not ready for publication';
  end if;
  if (select count(*) from public.product_catalog where publication_state = 'published') >= 500 then
    raise exception using errcode = '22023', message = 'published catalog limit reached';
  end if;
  select coalesce(max(catalog_order), -1) + 1 into next_position
    from public.product_catalog where publication_state = 'published';
  if next_position > 9999 then
    raise exception using errcode = '22023', message = 'catalog position limit reached';
  end if;
  update public.product_catalog
    set publication_state = 'published', catalog_order = next_position,
        last_change_note = 'Produto revisado e publicado pelo painel'
    where id = p_product_id
    returning * into product;
  return product;
end;
$$;
revoke all on function public.admin_publish_catalog_product(uuid, integer)
  from public, anon, authenticated, service_role;
grant execute on function public.admin_publish_catalog_product(uuid, integer) to authenticated;
