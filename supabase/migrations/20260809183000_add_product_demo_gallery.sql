-- 6DNX product demonstration gallery.
-- Additive and backward-compatible: existing cards receive an empty gallery;
-- no title, price, image or publication state is overwritten.

alter table public.product_catalog
  add column if not exists demo_images jsonb not null default '[]'::jsonb;

alter table public.product_catalog
  drop constraint if exists product_catalog_demo_images_shape;
alter table public.product_catalog
  add constraint product_catalog_demo_images_shape
  check (
    jsonb_typeof(demo_images) = 'array'
    and jsonb_array_length(demo_images) <= 5
  );

comment on column public.product_catalog.demo_images is
  'Up to five administrator-managed image URLs for the product detail carousel.';
