begin;

-- Version 2 expands the isolated Visual Studio document only. It never reads
-- or writes catalog, checkout, orders, wallets, rewards, or Slot outcomes.
-- Keep the v1 predicate callable during this migration so its mature text,
-- palette and bounded-particle rules remain the foundation of v2.
alter function public.site_experience_config_is_valid(jsonb)
  rename to site_experience_config_v1_is_valid;

create or replace function public.site_experience_config_is_valid(p_config jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    pg_catalog.jsonb_typeof(p_config) = 'object'
    and (p_config ->> 'schemaVersion') = '2'
    and public.site_experience_config_v1_is_valid(
      pg_catalog.jsonb_set(
        (((p_config #- '{home,background}') #- '{home,cinematic}')
          #- '{account,background}') #- '{slot,background}',
        '{schemaVersion}',
        '1'::jsonb,
        false
      )
    )
    and not exists (
      select 1
      from (values ('home'), ('account'), ('slot')) as pages(page_key)
      where pg_catalog.jsonb_typeof(p_config #> array[pages.page_key, 'background']) <> 'object'
         or exists (
           select 1
           from pg_catalog.jsonb_object_keys(
             p_config #> array[pages.page_key, 'background']
           ) as keys(key_name)
           where key_name <> 'imageUrl'
         )
         or pg_catalog.jsonb_typeof(
           p_config #> array[pages.page_key, 'background', 'imageUrl']
         ) not in ('null', 'string')
         or (
           pg_catalog.jsonb_typeof(
             p_config #> array[pages.page_key, 'background', 'imageUrl']
           ) = 'string'
           and coalesce(
             p_config #>> array[pages.page_key, 'background', 'imageUrl'],
             ''
           ) !~ '^https://[^/?#]+/storage/v1/object/public/product-assets/site-experience/[A-Za-z0-9_-]+[.](jpg|png|webp|avif)$'
         )
    )
    and pg_catalog.jsonb_typeof(p_config #> '{home,cinematic}') = 'object'
    and not exists (
      select 1
      from pg_catalog.jsonb_object_keys(p_config #> '{home,cinematic}') as keys(key_name)
      where key_name not in (
        'logoEnabled', 'eyeEnabled', 'logoEffectsEnabled',
        'charactersEnabled', 'productCharactersEnabled',
        'aurasEnabled', 'pointerEffectsEnabled', 'smokeEnabled'
      )
    )
    and (
      select pg_catalog.count(*)
      from pg_catalog.jsonb_object_keys(p_config #> '{home,cinematic}')
    ) = 8
    and not exists (
      select 1
      from (values
        ('logoEnabled'), ('eyeEnabled'), ('logoEffectsEnabled'),
        ('charactersEnabled'), ('productCharactersEnabled'),
        ('aurasEnabled'), ('pointerEffectsEnabled'), ('smokeEnabled')
      ) as controls(control_key)
      where pg_catalog.jsonb_typeof(
        p_config #> array['home', 'cinematic', controls.control_key]
      ) <> 'boolean'
    );
$$;

revoke all on function public.site_experience_config_is_valid(jsonb)
  from public, anon, authenticated;

-- Constraints are dropped only long enough to normalize the existing singleton
-- records and immutable history snapshots. No row is deleted or rewritten
-- outside the additive Studio configuration keys.
alter table public.site_experience_published
  drop constraint if exists site_experience_published_valid_config;
alter table public.site_experience_drafts
  drop constraint if exists site_experience_drafts_valid_config;
alter table public.site_experience_revisions
  drop constraint if exists site_experience_revisions_valid_config;

create or replace function public.site_experience_upgrade_to_v2(p_config jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select
    pg_catalog.jsonb_set(
      pg_catalog.jsonb_set(
        pg_catalog.jsonb_set(
          pg_catalog.jsonb_set(
            pg_catalog.jsonb_set(
              p_config,
              '{schemaVersion}',
              '2'::jsonb,
              true
            ),
            '{home,background}',
            '{"imageUrl":null}'::jsonb,
            true
          ),
          '{home,cinematic}',
          '{"logoEnabled":true,"eyeEnabled":true,"logoEffectsEnabled":true,"charactersEnabled":true,"productCharactersEnabled":true,"aurasEnabled":true,"pointerEffectsEnabled":true,"smokeEnabled":true}'::jsonb,
          true
        ),
        '{account,background}',
        '{"imageUrl":null}'::jsonb,
        true
      ),
      '{slot,background}',
      '{"imageUrl":null}'::jsonb,
      true
    );
$$;

revoke all on function public.site_experience_upgrade_to_v2(jsonb)
  from public, anon, authenticated;

update public.site_experience_published
set config = public.site_experience_upgrade_to_v2(config)
where (config ->> 'schemaVersion') = '1';

update public.site_experience_drafts
set config = public.site_experience_upgrade_to_v2(config)
where (config ->> 'schemaVersion') = '1';

update public.site_experience_revisions
set config = public.site_experience_upgrade_to_v2(config)
where (config ->> 'schemaVersion') = '1';

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
