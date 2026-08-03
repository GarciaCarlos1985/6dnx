-- Dedicated 4:5 checkout artwork for each catalog product.
-- Additive and reversible: null keeps the current card thumbnail fallback.

alter table public.product_catalog
  add column if not exists checkout_banner text;

alter table public.product_catalog
  drop constraint if exists product_catalog_checkout_banner_length;

alter table public.product_catalog
  add constraint product_catalog_checkout_banner_length
  check (
    checkout_banner is null
    or char_length(checkout_banner) between 1 and 500
  );

comment on column public.product_catalog.checkout_banner is
  'Optional 4:5 checkout artwork. Null falls back to the product thumbnail.';
