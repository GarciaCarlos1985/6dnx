begin;

-- Version 3 separates the homepage hero artwork from the catalog artwork.
-- Catalog, checkout, orders, wallets, rewards and Slot outcomes are untouched.
alter function public.site_experience_config_is_valid(jsonb)
  rename to site_experience_config_v2_is_valid;

create or replace function public.site_experience_config_is_valid(p_config jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce((
    pg_catalog.jsonb_typeof(p_config) = 'object'
    and (p_config ->> 'schemaVersion') = '3'
    and public.site_experience_config_v2_is_valid(
      pg_catalog.jsonb_set(
        pg_catalog.jsonb_set(
          p_config #- '{home,background}',
          '{home,background}',
          pg_catalog.jsonb_build_object(
            'imageUrl', p_config #> '{home,background,imageUrl}'
          ),
          true
        ),
        '{schemaVersion}',
        '2'::jsonb,
        false
      )
    )
    and pg_catalog.jsonb_typeof(p_config #> '{home,background}') = 'object'
    and (
      select pg_catalog.count(*)
      from pg_catalog.jsonb_object_keys(p_config #> '{home,background}')
    ) = 2
    and not exists (
      select 1
      from pg_catalog.jsonb_object_keys(p_config #> '{home,background}') as keys(key_name)
      where key_name not in ('imageUrl', 'catalogImageUrl')
    )
    and coalesce(
      pg_catalog.jsonb_typeof(p_config #> '{home,background,catalogImageUrl}'),
      'missing'
    ) in ('null', 'string')
    and (
      pg_catalog.jsonb_typeof(p_config #> '{home,background,catalogImageUrl}') = 'null'
      or coalesce(p_config #>> '{home,background,catalogImageUrl}', '')
        ~ '^https://[^/?#]+/storage/v1/object/public/product-assets/site-experience/[A-Za-z0-9_-]+[.](jpg|png|webp|avif)$'
    )
  ), false);
$$;

revoke all on function public.site_experience_config_is_valid(jsonb)
  from public, anon, authenticated;

alter table public.site_experience_published
  drop constraint if exists site_experience_published_valid_config;
alter table public.site_experience_drafts
  drop constraint if exists site_experience_drafts_valid_config;
alter table public.site_experience_revisions
  drop constraint if exists site_experience_revisions_valid_config;

create or replace function public.site_experience_upgrade_to_v3(p_config jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.jsonb_set(
    pg_catalog.jsonb_set(
      p_config,
      '{schemaVersion}',
      '3'::jsonb,
      false
    ),
    '{home,background,catalogImageUrl}',
    'null'::jsonb,
    true
  );
$$;

revoke all on function public.site_experience_upgrade_to_v3(jsonb)
  from public, anon, authenticated;

update public.site_experience_published
set config = public.site_experience_upgrade_to_v3(config)
where (config ->> 'schemaVersion') = '2';

update public.site_experience_drafts
set config = public.site_experience_upgrade_to_v3(config)
where (config ->> 'schemaVersion') = '2';

update public.site_experience_revisions
set config = public.site_experience_upgrade_to_v3(config)
where (config ->> 'schemaVersion') = '2';

alter table public.site_experience_published
  add constraint site_experience_published_valid_config
  check (public.site_experience_config_is_valid(config));
alter table public.site_experience_drafts
  add constraint site_experience_drafts_valid_config
  check (public.site_experience_config_is_valid(config));
alter table public.site_experience_revisions
  add constraint site_experience_revisions_valid_config
  check (public.site_experience_config_is_valid(config));

commit;
