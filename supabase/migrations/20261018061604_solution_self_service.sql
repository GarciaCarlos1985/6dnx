-- Targeted preparation only. Review and test locally before production.
begin;

alter table public.product_catalog
  add column if not exists game_name text,
  add column if not exists demo_images jsonb not null default '[]'::jsonb;

alter table public.product_catalog
  add constraint product_catalog_gallery_self_service_shape check (
    jsonb_typeof(demo_images) = 'array' and jsonb_array_length(demo_images) <= 5
  );

alter table public.product_catalog
  add constraint product_catalog_game_name_valid check (
    game_name is null or (
      char_length(btrim(game_name)) between 1 and 80
      and game_name !~ '[<>[:cntrl:]]'
      and game_name ~ '[[:alnum:]]'
    )
  );

create or replace function public.solution_guide_is_valid(p_guide jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare v_item jsonb;
begin
  if p_guide is null or jsonb_typeof(p_guide) <> 'object'
    or octet_length(p_guide::text) > 131072
    or not (p_guide ?& array['title','introduction','youtubeId','steps','questions'])
    or (select count(*) from jsonb_object_keys(p_guide)) <> 5
    or jsonb_typeof(p_guide->'title') <> 'string'
    or char_length(p_guide->>'title') > 120
    or jsonb_typeof(p_guide->'introduction') <> 'string'
    or char_length(p_guide->>'introduction') > 2000
    or not (p_guide->'youtubeId' = 'null'::jsonb or (
      jsonb_typeof(p_guide->'youtubeId') = 'string'
      and p_guide->>'youtubeId' ~ '^[A-Za-z0-9_-]{11}$'))
    or jsonb_typeof(p_guide->'steps') <> 'array'
    or jsonb_typeof(p_guide->'questions') <> 'array' then return false; end if;
  if jsonb_array_length(p_guide->'steps') > 80
    or jsonb_array_length(p_guide->'questions') > 15 then return false; end if;
  for v_item in select value from jsonb_array_elements(p_guide->'steps') loop
    if jsonb_typeof(v_item) <> 'string' or char_length(v_item #>> '{}') not between 1 and 1000 then return false; end if;
  end loop;
  for v_item in select value from jsonb_array_elements(p_guide->'questions') loop
    if jsonb_typeof(v_item) <> 'object' or not (v_item ?& array['question','answer'])
      or (select count(*) from jsonb_object_keys(v_item)) <> 2
      or jsonb_typeof(v_item->'question') <> 'string'
      or jsonb_typeof(v_item->'answer') <> 'string'
      or char_length(btrim(v_item->>'question')) not between 1 and 160
      or char_length(btrim(v_item->>'answer')) not between 1 and 2000 then return false; end if;
  end loop;
  if p_guide::text ~ '[<>]' then return false; end if;
  return true;
end;
$$;
revoke all on function public.solution_guide_is_valid(jsonb) from public, anon;
grant execute on function public.solution_guide_is_valid(jsonb) to authenticated, service_role;

create table public.product_solution_guides (
  product_source_key text primary key references public.product_catalog(source_key) on delete restrict,
  draft jsonb not null check (public.solution_guide_is_valid(draft)),
  published jsonb check (published is null or public.solution_guide_is_valid(published)),
  revision integer not null default 1 check (revision > 0),
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  check ((published is null) = (published_at is null))
);

create table public.product_solution_guide_revisions (
  product_source_key text not null references public.product_solution_guides(product_source_key) on delete restrict,
  revision integer not null check (revision > 0),
  snapshot jsonb not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id) on delete set null,
  primary key (product_source_key, revision)
);

alter table public.product_solution_guides enable row level security;
alter table public.product_solution_guide_revisions enable row level security;
revoke all on public.product_solution_guides, public.product_solution_guide_revisions from public, anon, authenticated, service_role;
grant select, insert, update on public.product_solution_guides to authenticated;
grant select, insert on public.product_solution_guide_revisions to authenticated;
grant select on public.product_solution_guides to service_role;

create policy "Admins read solution guides" on public.product_solution_guides for select to authenticated using ((select public.is_catalog_admin()));
create policy "Admins create solution guides" on public.product_solution_guides for insert to authenticated with check ((select public.is_catalog_admin()));
create policy "Admins update solution guides" on public.product_solution_guides for update to authenticated using ((select public.is_catalog_admin())) with check ((select public.is_catalog_admin()));
create policy "Admins read guide revisions" on public.product_solution_guide_revisions for select to authenticated using ((select public.is_catalog_admin()));
create policy "Admins record guide revisions" on public.product_solution_guide_revisions for insert to authenticated with check ((select public.is_catalog_admin()));

-- Buyers never read this table through the Data API. The application checks
-- an owned, paid order before its server-only repository reads published data.
create or replace function public.admin_save_solution_guide(
  p_product_source_key text, p_expected_revision integer, p_action text, p_guide jsonb
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_current public.product_solution_guides; v_result public.product_solution_guides;
begin
  if not coalesce(public.is_catalog_admin(), false) or auth.uid() is null then
    raise exception 'admin required' using errcode = '42501';
  end if;
  if p_action is null or p_action not in ('save','publish','unpublish')
    or p_expected_revision is null or p_expected_revision < 0
    or not public.solution_guide_is_valid(p_guide) then
    raise exception 'invalid guide' using errcode = '22023';
  end if;
  -- Serialize even the first save, without changing the catalog or commerce.
  perform 1 from public.product_catalog where source_key = p_product_source_key for update;
  if not found then raise exception 'product missing' using errcode = '22023'; end if;
  select * into v_current from public.product_solution_guides where product_source_key = p_product_source_key for update;
  if coalesce(v_current.revision, 0) <> p_expected_revision then
    raise exception 'guide revision conflict' using errcode = '40001';
  end if;
  if p_action <> 'save' and (v_current.product_source_key is null or v_current.draft <> p_guide) then
    raise exception 'save the draft first' using errcode = '40001';
  end if;
  if p_action = 'publish' and (
    char_length(btrim(p_guide->>'title')) = 0 or jsonb_array_length(p_guide->'steps') = 0
  ) then raise exception 'guide needs title and steps' using errcode = '22023'; end if;

  if v_current.product_source_key is null then
    insert into public.product_solution_guides(product_source_key,draft,updated_by)
      values(p_product_source_key,p_guide,auth.uid()) returning * into v_result;
  else
    insert into public.product_solution_guide_revisions(product_source_key,revision,snapshot,changed_by)
      values(v_current.product_source_key,v_current.revision,to_jsonb(v_current),auth.uid());
    update public.product_solution_guides set
      draft = case when p_action = 'save' then p_guide else draft end,
      published = case when p_action = 'publish' then draft when p_action = 'unpublish' then null else published end,
      published_at = case when p_action = 'publish' then clock_timestamp() when p_action = 'unpublish' then null else published_at end,
      revision = revision + 1, updated_at = clock_timestamp(), updated_by = auth.uid()
      where product_source_key = p_product_source_key returning * into v_result;
  end if;
  return jsonb_build_object('draft',v_result.draft,'published',v_result.published,'revision',v_result.revision,'publishedAt',v_result.published_at,'state','ready');
end;
$$;
revoke all on function public.admin_save_solution_guide(text,integer,text,jsonb) from public, anon, service_role;
grant execute on function public.admin_save_solution_guide(text,integer,text,jsonb) to authenticated;

commit;
