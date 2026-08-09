begin;

-- Estúdio Visual 6DNX. Este domínio é deliberadamente independente de
-- product_catalog, checkout, pedidos, carteiras e do motor da Slot.
create or replace function public.site_experience_plain_text_is_valid(
  p_value text,
  p_max_length integer
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    p_value is not null
    and p_max_length > 0
    and pg_catalog.btrim(p_value) <> ''
    and pg_catalog.char_length(p_value) <= p_max_length
    and p_value !~ '[[:cntrl:]]'
    and pg_catalog.strpos(p_value, '<') = 0
    and pg_catalog.strpos(p_value, '>') = 0
    and p_value !~* '\][[:space:]]*\([[:space:]]*javascript[[:space:]]*:'
    and not exists (
      select 1
      from pg_catalog.unnest(
        array[
          8203, 8204, 8205, 8206, 8207,
          8234, 8235, 8236, 8237, 8238,
          8294, 8295, 8296, 8297,
          65279
        ]
      ) as forbidden(codepoint)
      where pg_catalog.strpos(p_value, pg_catalog.chr(forbidden.codepoint)) > 0
    );
$$;

revoke all on function public.site_experience_plain_text_is_valid(text, integer)
  from public, anon, authenticated;

create or replace function public.site_experience_relative_luminance(p_hex text)
returns double precision
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  v_red double precision;
  v_green double precision;
  v_blue double precision;
begin
  if p_hex !~ '^#[0-9A-F]{6}$' then
    return null;
  end if;

  v_red := pg_catalog.get_byte(pg_catalog.decode(pg_catalog.substr(p_hex, 2, 2), 'hex'), 0) / 255.0;
  v_green := pg_catalog.get_byte(pg_catalog.decode(pg_catalog.substr(p_hex, 4, 2), 'hex'), 0) / 255.0;
  v_blue := pg_catalog.get_byte(pg_catalog.decode(pg_catalog.substr(p_hex, 6, 2), 'hex'), 0) / 255.0;

  v_red := case when v_red <= 0.03928 then v_red / 12.92
    else pg_catalog.power((v_red + 0.055) / 1.055, 2.4) end;
  v_green := case when v_green <= 0.03928 then v_green / 12.92
    else pg_catalog.power((v_green + 0.055) / 1.055, 2.4) end;
  v_blue := case when v_blue <= 0.03928 then v_blue / 12.92
    else pg_catalog.power((v_blue + 0.055) / 1.055, 2.4) end;

  return 0.2126 * v_red + 0.7152 * v_green + 0.0722 * v_blue;
end;
$$;

create or replace function public.site_experience_contrast_ratio(
  p_first text,
  p_second text
)
returns double precision
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  v_first double precision := public.site_experience_relative_luminance(p_first);
  v_second double precision := public.site_experience_relative_luminance(p_second);
begin
  if v_first is null or v_second is null then
    return null;
  end if;
  return (greatest(v_first, v_second) + 0.05)
    / (least(v_first, v_second) + 0.05);
end;
$$;

revoke all on function public.site_experience_relative_luminance(text)
  from public, anon, authenticated;
revoke all on function public.site_experience_contrast_ratio(text, text)
  from public, anon, authenticated;

create or replace function public.site_experience_config_is_valid(p_config jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    pg_catalog.jsonb_typeof(p_config) = 'object'
    and (p_config ->> 'schemaVersion') = '1'
    and pg_catalog.octet_length(p_config::text) <= 49152
    and not exists (
      select 1
      from pg_catalog.jsonb_object_keys(p_config) as keys(key_name)
      where key_name not in ('schemaVersion', 'home', 'account', 'slot')
    )
    and not exists (
      select 1
      from (values ('home'), ('account'), ('slot')) as pages(page_key)
      where pg_catalog.jsonb_typeof(p_config -> pages.page_key) <> 'object'
         or pg_catalog.jsonb_typeof(p_config #> array[pages.page_key, 'content']) <> 'object'
         or pg_catalog.jsonb_typeof(p_config #> array[pages.page_key, 'theme']) <> 'object'
         or pg_catalog.jsonb_typeof(p_config #> array[pages.page_key, 'effects']) <> 'object'
         or exists (
           select 1
           from pg_catalog.jsonb_object_keys(p_config -> pages.page_key) as keys(key_name)
           where key_name not in ('content', 'theme', 'effects')
         )
         or exists (
           select 1
           from pg_catalog.jsonb_object_keys(
             p_config #> array[pages.page_key, 'content']
           ) as keys(content_key)
           where case pages.page_key
             when 'home' then content_key not in (
               'heroHeadlineLead', 'heroHeadlineAccent', 'heroHeadlineTail',
               'heroSupport', 'heroRevealTitle', 'heroRevealAccent',
               'heroRevealSupport', 'heroCtaLabel', 'catalogTitle',
               'catalogDescription', 'continuationEyebrow', 'continuationTitle'
             )
             when 'account' then content_key not in (
               'navigationLabel', 'anonymousEyebrow', 'anonymousTitle',
               'anonymousSupport', 'journeyEyebrow', 'journeyTitle',
               'slotCardEyebrow', 'slotCardTitle', 'ordersEyebrow', 'ordersTitle'
             )
             when 'slot' then content_key not in (
               'heroEyebrow', 'heroTitle', 'heroAccent', 'heroSupport',
               'primaryAction', 'secondaryAction', 'mascotLabel',
               'machineEyebrow', 'machineTitle', 'rulesEyebrow', 'rulesTitle'
             )
             else true
           end
         )
         or (
           select pg_catalog.count(*)
           from pg_catalog.jsonb_object_keys(
             p_config #> array[pages.page_key, 'content']
           ) as keys(content_key)
         ) <> case pages.page_key when 'home' then 12 when 'account' then 10 else 11 end
         or exists (
           select 1
           from pg_catalog.jsonb_each(
             p_config #> array[pages.page_key, 'content']
           ) as fields(field_key, field_value)
           where pg_catalog.jsonb_typeof(field_value) <> 'string'
              or not public.site_experience_plain_text_is_valid(
                field_value #>> '{}',
                case pages.page_key
                  when 'home' then case field_key
                    when 'heroHeadlineLead' then 40
                    when 'heroHeadlineAccent' then 80
                    when 'heroHeadlineTail' then 60
                    when 'heroSupport' then 220
                    when 'heroRevealTitle' then 100
                    when 'heroRevealAccent' then 60
                    when 'heroRevealSupport' then 100
                    when 'heroCtaLabel' then 32
                    when 'catalogTitle' then 80
                    when 'catalogDescription' then 260
                    when 'continuationEyebrow' then 60
                    when 'continuationTitle' then 80
                    else 0
                  end
                  when 'account' then case field_key
                    when 'navigationLabel' then 40
                    when 'anonymousEyebrow' then 60
                    when 'anonymousTitle' then 110
                    when 'anonymousSupport' then 260
                    when 'journeyEyebrow' then 60
                    when 'journeyTitle' then 80
                    when 'slotCardEyebrow' then 60
                    when 'slotCardTitle' then 80
                    when 'ordersEyebrow' then 60
                    when 'ordersTitle' then 80
                    else 0
                  end
                  when 'slot' then case field_key
                    when 'heroEyebrow' then 60
                    when 'heroTitle' then 70
                    when 'heroAccent' then 24
                    when 'heroSupport' then 260
                    when 'primaryAction' then 40
                    when 'secondaryAction' then 40
                    when 'mascotLabel' then 60
                    when 'machineEyebrow' then 60
                    when 'machineTitle' then 90
                    when 'rulesEyebrow' then 60
                    when 'rulesTitle' then 90
                    else 0
                  end
                  else 0
                end
              )
         )
         or exists (
           select 1
           from pg_catalog.jsonb_object_keys(
             p_config #> array[pages.page_key, 'theme']
           ) as keys(key_name)
           where key_name not in (
             'backgroundColor', 'surfaceColor', 'accentColor', 'headingColor',
             'bodyColor', 'displayFont', 'bodyFont'
           )
         )
         or coalesce(p_config #>> array[pages.page_key, 'theme', 'backgroundColor'], '') !~ '^#[0-9A-F]{6}$'
         or coalesce(p_config #>> array[pages.page_key, 'theme', 'surfaceColor'], '') !~ '^#[0-9A-F]{6}$'
          or coalesce(p_config #>> array[pages.page_key, 'theme', 'accentColor'], '') !~ '^#[0-9A-F]{6}$'
          or coalesce(p_config #>> array[pages.page_key, 'theme', 'headingColor'], '') !~ '^#[0-9A-F]{6}$'
          or coalesce(p_config #>> array[pages.page_key, 'theme', 'bodyColor'], '') !~ '^#[0-9A-F]{6}$'
          or coalesce(public.site_experience_contrast_ratio(
            p_config #>> array[pages.page_key, 'theme', 'backgroundColor'],
            p_config #>> array[pages.page_key, 'theme', 'headingColor']
          ) < 4.5, true)
          or coalesce(public.site_experience_contrast_ratio(
            p_config #>> array[pages.page_key, 'theme', 'backgroundColor'],
            p_config #>> array[pages.page_key, 'theme', 'bodyColor']
          ) < 4.5, true)
          or coalesce(public.site_experience_contrast_ratio(
            p_config #>> array[pages.page_key, 'theme', 'backgroundColor'],
            p_config #>> array[pages.page_key, 'theme', 'accentColor']
          ) < 3, true)
          or coalesce(p_config #>> array[pages.page_key, 'theme', 'displayFont'], '') not in ('archivo-black', 'manrope')
          or coalesce(p_config #>> array[pages.page_key, 'theme', 'bodyFont'], '') not in ('archivo-black', 'manrope')
          or exists (
            select 1
            from pg_catalog.jsonb_object_keys(
              p_config #> array[pages.page_key, 'effects']
            ) as keys(key_name)
            where key_name not in ('density', 'families')
          )
          or coalesce(p_config #>> array[pages.page_key, 'effects', 'density'], '') not in ('off', 'light', 'standard')
         or pg_catalog.jsonb_typeof(p_config #> array[pages.page_key, 'effects', 'families']) <> 'array'
         or pg_catalog.jsonb_array_length(p_config #> array[pages.page_key, 'effects', 'families']) > 2
         or exists (
           select 1
           from pg_catalog.jsonb_array_elements_text(
             p_config #> array[pages.page_key, 'effects', 'families']
           ) as families(family_name)
           where family_name not in ('feathers', 'ammo', 'embers', 'sparks', 'lightning')
         )
         or (
           select pg_catalog.count(*)
           from pg_catalog.jsonb_array_elements_text(
             p_config #> array[pages.page_key, 'effects', 'families']
           ) as families(family_name)
         ) <> (
           select pg_catalog.count(distinct family_name)
           from pg_catalog.jsonb_array_elements_text(
             p_config #> array[pages.page_key, 'effects', 'families']
           ) as families(family_name)
         )
         or (
           (p_config #>> array[pages.page_key, 'effects', 'density']) = 'off'
           and pg_catalog.jsonb_array_length(
             p_config #> array[pages.page_key, 'effects', 'families']
           ) <> 0
         )
         or (
           (p_config #>> array[pages.page_key, 'effects', 'density']) <> 'off'
           and pg_catalog.jsonb_array_length(
             p_config #> array[pages.page_key, 'effects', 'families']
           ) = 0
         )
    );
$$;

revoke all on function public.site_experience_config_is_valid(jsonb)
  from public, anon, authenticated;

create table if not exists public.site_experience_published (
  id text primary key,
  schema_version smallint not null default 1 check (schema_version = 1),
  config jsonb not null,
  revision integer not null default 1 check (revision >= 1),
  published_at timestamptz not null default clock_timestamp(),
  constraint site_experience_published_singleton check (id = 'site'),
  constraint site_experience_published_valid_config
    check (public.site_experience_config_is_valid(config))
);

create table if not exists public.site_experience_drafts (
  id text primary key,
  schema_version smallint not null default 1 check (schema_version = 1),
  config jsonb not null,
  draft_revision integer not null default 1 check (draft_revision >= 1),
  base_published_revision integer not null default 1
    check (base_published_revision >= 1),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default clock_timestamp(),
  constraint site_experience_drafts_singleton check (id = 'site'),
  constraint site_experience_drafts_valid_config
    check (public.site_experience_config_is_valid(config))
);

create table if not exists public.site_experience_revisions (
  id bigint generated always as identity primary key,
  site_id text not null references public.site_experience_published(id)
    on delete restrict check (site_id = 'site'),
  schema_version smallint not null default 1 check (schema_version = 1),
  revision integer not null check (revision >= 1),
  config jsonb not null,
  published_by uuid references auth.users(id) on delete set null,
  published_at timestamptz not null,
  created_at timestamptz not null default clock_timestamp(),
  constraint site_experience_revisions_valid_config
    check (public.site_experience_config_is_valid(config)),
  unique (site_id, revision)
);

create index if not exists site_experience_revisions_recent_idx
  on public.site_experience_revisions (site_id, revision desc);

do $$
declare
  v_inserted boolean := false;
  v_default jsonb := $config$
  {
    "schemaVersion": 1,
    "home": {
      "content": {
        "heroHeadlineLead": "Soluções",
        "heroHeadlineAccent": "Incríveis, Seguras",
        "heroHeadlineTail": "e Profissionais",
        "heroSupport": "Descubra soluções criadas para elevar sua experiência em diferentes jogos.",
        "heroRevealTitle": "Informação clara. Compra assistida.",
        "heroRevealAccent": "Suporte humano.",
        "heroRevealSupport": "Escolha sua solução abaixo",
        "heroCtaLabel": "Comprar agora",
        "catalogTitle": "Soluções 6DNX",
        "catalogDescription": "Doze soluções ficam à vista. Cada fileira possui navegação própria para explorar o restante do catálogo sem perder a posição.",
        "continuationEyebrow": "Catálogo em profundidade",
        "continuationTitle": "Continue explorando"
      },
      "theme": { "backgroundColor": "#000000", "surfaceColor": "#10070A", "accentColor": "#F00836", "headingColor": "#FFFFFF", "bodyColor": "#D7D7DB", "displayFont": "archivo-black", "bodyFont": "manrope" },
      "effects": { "density": "standard", "families": ["embers", "sparks"] }
    },
    "account": {
      "content": {
        "navigationLabel": "Central do jogador",
        "anonymousEyebrow": "Sua história começa aqui",
        "anonymousTitle": "Entre para transformar compras em uma jornada 6DNX.",
        "anonymousSupport": "O login não é obrigatório para comprar. Ele conecta novos pedidos, histórico e benefícios à sua conta.",
        "journeyEyebrow": "Ecossistema 6DNX",
        "journeyTitle": "Sua jornada de benefícios",
        "slotCardEyebrow": "Nova experiência",
        "slotCardTitle": "Slot da Sorte 6DNX",
        "ordersEyebrow": "Histórico operacional",
        "ordersTitle": "Meus pedidos"
      },
      "theme": { "backgroundColor": "#050507", "surfaceColor": "#0B0709", "accentColor": "#F00836", "headingColor": "#FFFFFF", "bodyColor": "#D7D7DB", "displayFont": "archivo-black", "bodyFont": "manrope" },
      "effects": { "density": "light", "families": ["embers"] }
    },
    "slot": {
      "content": {
        "heroEyebrow": "A próxima experiência 6DNX",
        "heroTitle": "Slot da Sorte",
        "heroAccent": "6DNX",
        "heroSupport": "Uma experiência cinematográfica de fidelidade. Conheça a cabine, veja o mascote reagir e entenda as regras.",
        "primaryAction": "Conhecer a experiência",
        "secondaryAction": "Ver regras claras",
        "mascotLabel": "O guardião da cabine",
        "machineEyebrow": "Cabine visual 6DNX",
        "machineTitle": "Conheça a experiência.",
        "rulesEyebrow": "Diversão responsável",
        "rulesTitle": "Regras claras, antes de jogar."
      },
      "theme": { "backgroundColor": "#040205", "surfaceColor": "#100207", "accentColor": "#EF0038", "headingColor": "#FFFFFF", "bodyColor": "#D7D7DB", "displayFont": "archivo-black", "bodyFont": "manrope" },
      "effects": { "density": "standard", "families": ["embers", "sparks"] }
    }
  }
  $config$::jsonb;
begin
  insert into public.site_experience_published (id, config)
  values ('site', v_default)
  on conflict (id) do nothing
  returning true into v_inserted;

  -- Preservar os 12 textos que Maycon possa ter publicado no editor legado.
  -- O bloco dinâmico permite aplicar esta migration de forma direcionada mesmo
  -- quando o módulo legado ainda não existe no banco alvo.
  if v_inserted and pg_catalog.to_regclass('public.storefront_content') is not null then
    execute $legacy$
      update public.site_experience_published as p
      set config = pg_catalog.jsonb_set(
        p.config,
        '{home,content}',
        (
          select pg_catalog.jsonb_build_object(
            'heroHeadlineLead', s.hero_headline_lead,
            'heroHeadlineAccent', s.hero_headline_accent,
            'heroHeadlineTail', s.hero_headline_tail,
            'heroSupport', s.hero_support,
            'heroRevealTitle', s.hero_reveal_title,
            'heroRevealAccent', s.hero_reveal_accent,
            'heroRevealSupport', s.hero_reveal_support,
            'heroCtaLabel', s.hero_cta_label,
            'catalogTitle', s.catalog_title,
            'catalogDescription', s.catalog_description,
            'continuationEyebrow', s.continuation_eyebrow,
            'continuationTitle', s.continuation_title
          )
          from public.storefront_content as s
          where s.id = 'home'
        )
      )
      where p.id = 'site'
        and exists (select 1 from public.storefront_content as s where s.id = 'home')
    $legacy$;
  end if;

  insert into public.site_experience_drafts (
    id, config, draft_revision, base_published_revision
  )
  select p.id, p.config, 1, p.revision
  from public.site_experience_published as p
  where p.id = 'site'
  on conflict (id) do nothing;
end;
$$;

alter table public.site_experience_published enable row level security;
alter table public.site_experience_drafts enable row level security;
alter table public.site_experience_revisions enable row level security;

revoke all on table public.site_experience_published,
  public.site_experience_drafts,
  public.site_experience_revisions
  from public, anon, authenticated;
grant select on table public.site_experience_published to anon, authenticated;

drop policy if exists "Site experience published is public"
  on public.site_experience_published;
create policy "Site experience published is public"
on public.site_experience_published
for select
to anon, authenticated
using (id = 'site');

create or replace function public.admin_get_site_experience()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.is_catalog_admin() then
    raise exception 'admin required' using errcode = '42501';
  end if;

  select pg_catalog.jsonb_build_object(
    'published', p.config,
    'draft', d.config,
    'publishedRevision', p.revision,
    'draftRevision', d.draft_revision,
    'basePublishedRevision', d.base_published_revision,
    'updatedAt', d.updated_at,
    'history', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'revision', h.revision,
          'publishedAt', h.published_at
        ) order by h.revision desc
      )
      from (
        select r.revision, r.published_at
        from public.site_experience_revisions as r
        where r.site_id = 'site'
        order by r.revision desc
        limit 20
      ) as h
    ), '[]'::jsonb)
  ) into v_result
  from public.site_experience_published as p
  join public.site_experience_drafts as d on d.id = p.id
  where p.id = 'site';

  return v_result;
end;
$$;

create or replace function public.save_site_experience_draft(
  p_config jsonb,
  p_expected_draft_revision integer,
  p_expected_published_revision integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_draft public.site_experience_drafts;
  v_published_revision integer;
begin
  if not public.is_catalog_admin() then
    raise exception 'admin required' using errcode = '42501';
  end if;
  if not public.site_experience_config_is_valid(p_config) then
    raise exception 'invalid visual config' using errcode = '22023';
  end if;

  select p.revision into v_published_revision
  from public.site_experience_published as p
  where p.id = 'site'
  for update;
  if v_published_revision <> p_expected_published_revision then
    raise exception 'published revision conflict' using errcode = '40001';
  end if;

  select d.* into v_draft
  from public.site_experience_drafts as d
  where d.id = 'site'
  for update;
  if v_draft.draft_revision <> p_expected_draft_revision then
    raise exception 'draft revision conflict' using errcode = '40001';
  end if;

  update public.site_experience_drafts as d
  set config = p_config,
      draft_revision = d.draft_revision + 1,
      base_published_revision = v_published_revision,
      updated_by = auth.uid(),
      updated_at = clock_timestamp()
  where d.id = 'site'
  returning d.* into v_draft;

  return pg_catalog.jsonb_build_object(
    'draft', v_draft.config,
    'draftRevision', v_draft.draft_revision,
    'basePublishedRevision', v_draft.base_published_revision,
    'updatedAt', v_draft.updated_at
  );
end;
$$;

create or replace function public.publish_site_experience(
  p_expected_draft_revision integer,
  p_expected_published_revision integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_published public.site_experience_published;
  v_draft public.site_experience_drafts;
begin
  if not public.is_catalog_admin() then
    raise exception 'admin required' using errcode = '42501';
  end if;
  if coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  select p.* into v_published
  from public.site_experience_published as p
  where p.id = 'site'
  for update;
  if v_published.revision <> p_expected_published_revision then
    raise exception 'published revision conflict' using errcode = '40001';
  end if;

  select d.* into v_draft
  from public.site_experience_drafts as d
  where d.id = 'site'
  for update;
  if v_draft.draft_revision <> p_expected_draft_revision
     or v_draft.base_published_revision <> v_published.revision then
    raise exception 'draft revision conflict' using errcode = '40001';
  end if;

  insert into public.site_experience_revisions (
    site_id, revision, config, published_by, published_at
  ) values (
    'site', v_published.revision, v_published.config,
    auth.uid(), v_published.published_at
  );

  update public.site_experience_published as p
  set config = v_draft.config,
      revision = p.revision + 1,
      published_at = clock_timestamp()
  where p.id = 'site'
  returning p.* into v_published;

  update public.site_experience_drafts as d
  set draft_revision = d.draft_revision + 1,
      base_published_revision = v_published.revision,
      updated_by = auth.uid(),
      updated_at = clock_timestamp()
  where d.id = 'site'
  returning d.* into v_draft;

  return pg_catalog.jsonb_build_object(
    'published', v_published.config,
    'draft', v_draft.config,
    'publishedRevision', v_published.revision,
    'draftRevision', v_draft.draft_revision,
    'basePublishedRevision', v_draft.base_published_revision,
    'updatedAt', v_draft.updated_at,
    'publishedAt', v_published.published_at
  );
end;
$$;

create or replace function public.restore_site_experience_revision_to_draft(
  p_revision integer,
  p_expected_draft_revision integer,
  p_expected_published_revision integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_snapshot jsonb;
  v_draft public.site_experience_drafts;
  v_published_revision integer;
begin
  if not public.is_catalog_admin() then
    raise exception 'admin required' using errcode = '42501';
  end if;
  if coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then
    raise exception 'aal2 required' using errcode = '42501';
  end if;
  select p.revision into v_published_revision
  from public.site_experience_published as p
  where p.id = 'site'
  for update;
  if v_published_revision <> p_expected_published_revision then
    raise exception 'published revision conflict' using errcode = '40001';
  end if;
  select r.config into v_snapshot
  from public.site_experience_revisions as r
  where r.site_id = 'site' and r.revision = p_revision;
  if v_snapshot is null then
    raise exception 'revision not found' using errcode = 'P0002';
  end if;

  select d.* into v_draft
  from public.site_experience_drafts as d
  where d.id = 'site'
  for update;
  if v_draft.draft_revision <> p_expected_draft_revision then
    raise exception 'draft revision conflict' using errcode = '40001';
  end if;

  update public.site_experience_drafts as d
  set config = v_snapshot,
      draft_revision = d.draft_revision + 1,
      base_published_revision = p_expected_published_revision,
      updated_by = auth.uid(),
      updated_at = clock_timestamp()
  where d.id = 'site'
  returning d.* into v_draft;

  return pg_catalog.jsonb_build_object(
    'draft', v_draft.config,
    'draftRevision', v_draft.draft_revision,
    'basePublishedRevision', v_draft.base_published_revision,
    'updatedAt', v_draft.updated_at
  );
end;
$$;

revoke all on function public.admin_get_site_experience()
  from public, anon, authenticated;
grant execute on function public.admin_get_site_experience()
  to authenticated;

revoke all on function public.save_site_experience_draft(jsonb, integer, integer)
  from public, anon, authenticated;
grant execute on function public.save_site_experience_draft(jsonb, integer, integer)
  to authenticated;

revoke all on function public.publish_site_experience(integer, integer)
  from public, anon, authenticated;
grant execute on function public.publish_site_experience(integer, integer)
  to authenticated;

revoke all on function public.restore_site_experience_revision_to_draft(integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.restore_site_experience_revision_to_draft(integer, integer, integer)
  to authenticated;

revoke insert, update, delete, truncate, references, trigger
  on public.site_experience_published,
  public.site_experience_drafts,
  public.site_experience_revisions
  from anon, authenticated, service_role;

commit;
