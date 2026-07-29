begin;

create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique
    check (char_length(external_id) between 1 and 200),
  slug text not null unique
    check (
      char_length(slug) between 1 and 180
      and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    ),
  title text not null check (char_length(title) between 3 and 220),
  summary text not null check (char_length(summary) between 10 and 800),
  game_name text not null check (char_length(game_name) between 2 and 80),
  category text not null check (category in ('release', 'update', 'community', 'ai')),
  source_name text not null check (char_length(source_name) between 2 and 120),
  source_url text not null
    check (
      char_length(source_url) between 10 and 2048
      and source_url like 'https://%'
    ),
  image_url text not null
    check (
      char_length(image_url) <= 2048
      and (image_url = '' or image_url like 'https://%')
    ),
  published_at timestamptz not null,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  editorial_weight smallint not null default 0 check (editorial_weight between -100 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_articles_public_feed_idx
  on public.news_articles (is_featured desc, editorial_weight desc, published_at desc)
  where status = 'published';

create index if not exists news_articles_category_published_idx
  on public.news_articles (category, published_at desc)
  where status = 'published';

alter table public.news_articles enable row level security;

revoke insert, update, delete, truncate, references, trigger
  on table public.news_articles
  from anon, authenticated;
grant select on table public.news_articles to anon, authenticated;

drop policy if exists "Published news is publicly readable" on public.news_articles;
create policy "Published news is publicly readable"
  on public.news_articles
  for select
  to anon, authenticated
  using (status = 'published');

create or replace function public.set_news_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists news_articles_set_updated_at on public.news_articles;
create trigger news_articles_set_updated_at
before update on public.news_articles
for each row execute function public.set_news_updated_at();

revoke all on function public.set_news_updated_at() from public, anon, authenticated;

create or replace function public.ingest_news_articles(items jsonb)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  affected integer;
begin
  if items is null
    or jsonb_typeof(items) <> 'array'
    or jsonb_array_length(items) > 24
  then
    raise exception 'items must be an array with at most 24 entries';
  end if;

  insert into public.news_articles (
    external_id,
    slug,
    title,
    summary,
    game_name,
    category,
    source_name,
    source_url,
    image_url,
    published_at
  )
  select
    payload.external_id,
    payload.slug,
    payload.title,
    payload.summary,
    payload.game_name,
    payload.category,
    payload.source_name,
    payload.source_url,
    payload.image_url,
    payload.published_at
  from jsonb_to_recordset(items) as payload(
    external_id text,
    slug text,
    title text,
    summary text,
    game_name text,
    category text,
    source_name text,
    source_url text,
    image_url text,
    published_at timestamptz
  )
  on conflict (external_id) do update set
    slug = excluded.slug,
    title = excluded.title,
    summary = excluded.summary,
    game_name = excluded.game_name,
    category = excluded.category,
    source_name = excluded.source_name,
    source_url = excluded.source_url,
    image_url = excluded.image_url,
    published_at = excluded.published_at,
    updated_at = now();

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.ingest_news_articles(jsonb) from public;
revoke all on function public.ingest_news_articles(jsonb) from anon, authenticated;
grant execute on function public.ingest_news_articles(jsonb) to service_role;

commit;
