begin;

create table if not exists public.storefront_content (
  id text primary key,
  hero_headline_lead text not null,
  hero_headline_accent text not null,
  hero_headline_tail text not null,
  hero_support text not null,
  hero_reveal_title text not null,
  hero_reveal_accent text not null,
  hero_reveal_support text not null,
  hero_cta_label text not null,
  catalog_title text not null,
  catalog_description text not null,
  continuation_eyebrow text not null,
  continuation_title text not null,
  revision integer not null default 1 check (revision >= 1),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint storefront_content_singleton check (id = 'home'),
  constraint storefront_content_required_text check (
    btrim(hero_headline_lead) <> '' and
    btrim(hero_headline_accent) <> '' and
    btrim(hero_headline_tail) <> '' and
    btrim(hero_support) <> '' and
    btrim(hero_reveal_title) <> '' and
    btrim(hero_reveal_accent) <> '' and
    btrim(hero_reveal_support) <> '' and
    btrim(hero_cta_label) <> '' and
    btrim(catalog_title) <> '' and
    btrim(catalog_description) <> '' and
    btrim(continuation_eyebrow) <> '' and
    btrim(continuation_title) <> ''
  )
);

create table if not exists public.storefront_content_revisions (
  id bigint generated always as identity primary key,
  content_id text not null references public.storefront_content(id) on delete cascade,
  revision integer not null,
  snapshot jsonb not null,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  unique (content_id, revision)
);

create index if not exists storefront_content_revisions_content_idx
  on public.storefront_content_revisions (content_id, revision desc);

create or replace function public.capture_storefront_content_revision()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.storefront_content_revisions (
    content_id,
    revision,
    snapshot,
    changed_by
  ) values (
    old.id,
    old.revision,
    to_jsonb(old),
    auth.uid()
  );

  new.revision := old.revision + 1;
  new.updated_at := clock_timestamp();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists storefront_content_capture_revision
  on public.storefront_content;
create trigger storefront_content_capture_revision
before update on public.storefront_content
for each row
when (old.* is distinct from new.*)
execute function public.capture_storefront_content_revision();

insert into public.storefront_content (
  id,
  hero_headline_lead,
  hero_headline_accent,
  hero_headline_tail,
  hero_support,
  hero_reveal_title,
  hero_reveal_accent,
  hero_reveal_support,
  hero_cta_label,
  catalog_title,
  catalog_description,
  continuation_eyebrow,
  continuation_title
) values (
  'home',
  'Soluções',
  'Incríveis, Seguras',
  'e Profissionais',
  'Descubra soluções criadas para elevar sua experiência em diferentes jogos.',
  'Informação clara. Compra assistida.',
  'Suporte humano.',
  'Escolha sua solução abaixo',
  'Comprar agora',
  'Soluções 6DNX',
  'Doze soluções ficam à vista. Cada fileira possui navegação própria para explorar o restante do catálogo sem perder a posição.',
  'Catálogo em profundidade',
  'Continue explorando'
)
on conflict (id) do nothing;

alter table public.storefront_content enable row level security;
alter table public.storefront_content_revisions enable row level security;

revoke all on table public.storefront_content from anon, authenticated;
grant select on table public.storefront_content to anon, authenticated;
grant update on table public.storefront_content to authenticated;

revoke all on table public.storefront_content_revisions from anon, authenticated;
grant select on table public.storefront_content_revisions to authenticated;

drop policy if exists "Storefront content is publicly readable"
  on public.storefront_content;
create policy "Storefront content is publicly readable"
on public.storefront_content
for select
to anon, authenticated
using (id = 'home');

drop policy if exists "Admins can update storefront content"
  on public.storefront_content;
create policy "Admins can update storefront content"
on public.storefront_content
for update
to authenticated
using (public.is_catalog_admin())
with check (public.is_catalog_admin() and id = 'home');

drop policy if exists "Admins can read storefront content history"
  on public.storefront_content_revisions;
create policy "Admins can read storefront content history"
on public.storefront_content_revisions
for select
to authenticated
using (public.is_catalog_admin());

-- No INSERT or DELETE policy by design. The singleton is seeded by migration,
-- then only versioned updates are accepted from the authenticated admin API.

commit;
