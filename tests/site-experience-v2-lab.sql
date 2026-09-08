-- Disposable PostgreSQL laboratory ONLY. Never run this fixture in Production.
\set ON_ERROR_STOP on
create role anon;
create role authenticated;
create role service_role;
create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
create function auth.jwt() returns jsonb language sql as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
create function public.is_catalog_admin() returns boolean language sql as $$
  select coalesce(auth.jwt() #>> '{app_metadata,role}', '') = 'admin'
$$;
\i /work/supabase/migrations/20260809220000_add_site_experience_studio.sql
create temp table studio_before as select config from public.site_experience_published;
\i /work/supabase/migrations/20260904120000_add_site_experience_background_and_cinematic_controls.sql
\i /work/supabase/migrations/20260908100000_add_site_experience_home_section_backgrounds.sql
begin;
do $$
declare saved jsonb; old_config jsonb; bad jsonb;
begin
  select config into saved from public.site_experience_published;
  select config into old_config from studio_before;
  if jsonb_set(((((saved #- '{home,background}') #- '{home,cinematic}') #- '{account,background}') #- '{slot,background}'), '{schemaVersion}', '1') <> old_config then
    raise exception 'Existing editorial content changed';
  end if;
  if public.site_experience_config_is_valid(saved) is distinct from true then raise exception 'Valid v3 rejected'; end if;
  foreach bad in array array[
    null::jsonb,
    saved #- '{home,background}',
    saved #- '{home,background,imageUrl}',
    saved #- '{home,background,catalogImageUrl}',
    saved #- '{home,cinematic}',
    saved #- '{home,cinematic,logoEnabled}',
    jsonb_set(saved, '{home,cinematic,logoEnabled}', 'null'),
    jsonb_set(saved, '{home,background}', 'null'),
    jsonb_set(saved, '{home,background}', '[]'),
    jsonb_set(saved, '{home,background,imageUrl}', '"https://evil.example/image.png"'),
    jsonb_set(saved, '{home,background,catalogImageUrl}', '"https://evil.example/image.png"')
  ] loop
    if public.site_experience_config_is_valid(bad) is distinct from false then raise exception 'Invalid config accepted'; end if;
  end loop;
  perform set_config('request.jwt.claims', '{"app_metadata":{"role":"user"},"aal":"aal2"}', true);
  begin
    perform public.save_site_experience_draft(saved, 1, 1);
    raise exception 'Non-admin saved a draft';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claims', '{"app_metadata":{"role":"admin"},"aal":"aal1"}', true);
  saved := jsonb_set(saved, '{home,cinematic,logoEnabled}', 'false');
  perform public.save_site_experience_draft(saved, 1, 1);
  begin
    perform public.save_site_experience_draft(saved, 1, 1);
    raise exception 'Stale revision accepted';
  exception when serialization_failure then null; end;
  begin
    perform public.publish_site_experience(2, 1);
    raise exception 'AAL1 published';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claims', '{"app_metadata":{"role":"admin"},"aal":"aal2"}', true);
  perform public.publish_site_experience(2, 1);
  perform public.restore_site_experience_revision_to_draft(1, 3, 2);
  if (select config #>> '{home,cinematic,logoEnabled}' from public.site_experience_drafts) <> 'true' then raise exception 'Restore failed'; end if;
  if has_table_privilege('anon','public.site_experience_drafts','select') then raise exception 'Public draft access'; end if;
  if has_table_privilege('authenticated','public.site_experience_published','update') then raise exception 'Direct public edit'; end if;
  raise notice 'PASS: content preserved; null/malformed rejected; draft save; stale conflict; non-admin denied; AAL1 denied; AAL2 publish; restore; grants';
end $$;
rollback;
