-- Minimal pre-migration schema for the rollback-only payment claim test.
-- This fixture is intentionally local and contains no Production data.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin;
  end if;
end;
$$;

create table public.product_catalog (
  source_key text primary key,
  slug text not null,
  title text not null
);

create table public.commerce_offers (
  id uuid primary key,
  product_source_key text not null references public.product_catalog(source_key),
  variant_name text not null,
  amount_cents integer not null,
  status text not null
);

create table public.commerce_orders (
  id uuid primary key,
  client_request_id uuid not null unique,
  external_id text not null unique,
  offer_id uuid not null references public.commerce_offers(id),
  product_source_key text not null,
  product_slug text not null,
  product_title text not null,
  variant_name text not null,
  amount_cents integer not null,
  currency text not null default 'BRL',
  payer_name text not null,
  payer_document_hash text not null,
  payer_document_last4 text not null,
  request_fingerprint_hash text not null,
  status text not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.commerce_payment_attempts (
  order_id uuid primary key references public.commerce_orders(id) on delete cascade,
  provider text not null default 'storm_wallet',
  provider_payment_id text,
  idempotency_key text,
  provider_status text,
  provider_complete_observed_at timestamptz,
  last_polled_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index commerce_attempts_provider_payment_unique
  on public.commerce_payment_attempts (provider_payment_id)
  where provider_payment_id is not null;
create unique index commerce_attempts_idempotency_unique
  on public.commerce_payment_attempts (idempotency_key)
  where idempotency_key is not null;

insert into public.product_catalog (source_key, slug, title)
values ('fixture-product', 'fixture-product', 'Fixture Product');

insert into public.commerce_offers (
  id, product_source_key, variant_name, amount_cents, status
) values (
  '10000000-0000-4000-8000-000000000001',
  'fixture-product',
  'Legacy ambiguous attempt',
  1099,
  'draft'
);

insert into public.commerce_orders (
  id, client_request_id, external_id, offer_id, product_source_key,
  product_slug, product_title, variant_name, amount_cents, payer_name,
  payer_document_hash, payer_document_last4, request_fingerprint_hash, status
) values (
  '20000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  '6DNX-legacy-ambiguous-attempt',
  '10000000-0000-4000-8000-000000000001',
  'fixture-product',
  'fixture-product',
  'Fixture Product',
  'Legacy ambiguous attempt',
  1099,
  'Teste Integracao',
  repeat('a', 64),
  '0000',
  repeat('b', 64),
  'payment_creation_failed'
);

insert into public.commerce_payment_attempts (
  order_id, provider, idempotency_key, last_error_code
) values (
  '20000000-0000-4000-8000-000000000001',
  'storm_wallet',
  '6DNX-legacy-ambiguous-attempt',
  'storm-network'
);
