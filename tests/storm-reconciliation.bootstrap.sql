create schema if not exists auth;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end;
$$;

create table if not exists auth.users (
  id uuid primary key
);

create table if not exists public.product_catalog (
  source_key text primary key,
  variants jsonb not null
);

create or replace function public.is_catalog_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select false;
$$;

insert into public.product_catalog (source_key, variants)
values (
  'storm-reconciliation-test',
  '[{"name":"Teste","priceBRL":1}]'::jsonb
)
on conflict (source_key) do update set variants = excluded.variants;
