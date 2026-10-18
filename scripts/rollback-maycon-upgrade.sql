-- Target: 6DNX muwqyoeisiuwadxoiokz, baseline captured 2026-10-18 17:48 UTC.
-- Manual recovery script, NEVER part of automatic Supabase migrations.
-- Revert application code first. Obtain a fresh backup and human approval.
-- Execute on the verified project with this session setting explicitly supplied:
-- SET sixdnx.rollback_confirmation = 'revert-maycon-64ba685-c2734e9';
-- This script refuses to discard new guide/game/gallery content.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $$
begin
  if current_setting('sixdnx.rollback_confirmation', true)
      is distinct from 'revert-maycon-64ba685-c2734e9' then
    raise exception 'Human-approved rollback setting required' using errcode = '42501';
  end if;
  if to_regclass('public.product_catalog') is null then
    raise exception '6DNX catalog missing; stop and verify the project';
  end if;
end;
$$;

lock table public.product_catalog in share row exclusive mode;

do $$
begin
  if to_regclass('public.product_solution_guides') is not null then
    lock table public.product_solution_guides in access exclusive mode;
    if exists(select 1 from public.product_solution_guides) then
      raise exception 'Guide content exists; export and preserve it before removing this schema' using errcode = '55000';
    end if;
  end if;
  if to_regclass('public.product_solution_guide_revisions') is not null then
    lock table public.product_solution_guide_revisions in access exclusive mode;
    if exists(select 1 from public.product_solution_guide_revisions) then
      raise exception 'Guide history exists; preserve it before removing this schema' using errcode = '55000';
    end if;
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public'
      and table_name='product_catalog' and column_name='game_name') then
    if exists(select 1 from public.product_catalog where game_name is not null) then
      raise exception 'Game assignments exist; preserve them before removing this column' using errcode = '55000';
    end if;
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public'
      and table_name='product_catalog' and column_name='demo_images') then
    if exists(select 1 from public.product_catalog where demo_images <> '[]'::jsonb) then
      raise exception 'Gallery content exists; preserve it before removing this column' using errcode = '55000';
    end if;
  end if;
end;
$$;

drop function if exists public.admin_publish_catalog_product(uuid, integer);
drop function if exists public.admin_save_solution_guide(text, integer, text, jsonb);
drop table if exists public.product_solution_guide_revisions;
drop table if exists public.product_solution_guides;
drop function if exists public.solution_guide_is_valid(jsonb);
alter table public.product_catalog
  drop constraint if exists product_catalog_gallery_self_service_shape,
  drop constraint if exists product_catalog_game_name_valid,
  drop column if exists game_name,
  drop column if exists demo_images;

-- Existing products, revisions, commerce, auth and Storage are never deleted.
-- Migration ledger entries remain as audit evidence; do not rewrite history.
commit;
