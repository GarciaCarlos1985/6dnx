-- 6DNX commercial coupons.
-- IMPORTANT: apply this migration by its exact filename after reviewing the
-- remote migration history. Do not use a generic `supabase db push` because
-- older, unrelated migrations may still be pending in Production.

create table if not exists public.commerce_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique
    check (code ~ '^[A-Z0-9][A-Z0-9_-]{2,31}$'),
  name text not null check (char_length(name) between 3 and 80),
  discount_percent integer not null check (discount_percent between 1 and 90),
  minimum_amount_cents integer not null default 0
    check (minimum_amount_cents between 0 and 10000000),
  starts_at timestamptz,
  expires_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at is null or starts_at is null or expires_at > starts_at)
);

create index if not exists commerce_coupons_status_window_idx
  on public.commerce_coupons (status, starts_at, expires_at);

create table if not exists public.commerce_order_discounts (
  order_id uuid primary key
    references public.commerce_orders(id) on delete cascade,
  coupon_id uuid not null
    references public.commerce_coupons(id) on delete restrict,
  coupon_code text not null
    check (coupon_code ~ '^[A-Z0-9][A-Z0-9_-]{2,31}$'),
  coupon_name text not null check (char_length(coupon_name) between 3 and 80),
  discount_percent integer not null check (discount_percent between 1 and 90),
  original_amount_cents integer not null check (original_amount_cents > 0),
  discount_amount_cents integer not null check (discount_amount_cents > 0),
  final_amount_cents integer not null check (final_amount_cents > 0),
  created_at timestamptz not null default now(),
  check (original_amount_cents - discount_amount_cents = final_amount_cents)
);

create index if not exists commerce_order_discounts_coupon_idx
  on public.commerce_order_discounts (coupon_id, created_at desc);

drop trigger if exists commerce_coupons_touch_updated_at
  on public.commerce_coupons;
create trigger commerce_coupons_touch_updated_at
before update on public.commerce_coupons
for each row execute function public.touch_commerce_updated_at();

alter table public.commerce_coupons enable row level security;
alter table public.commerce_order_discounts enable row level security;

revoke all on table public.commerce_coupons
  from public, anon, authenticated, service_role;
revoke all on table public.commerce_order_discounts
  from public, anon, authenticated, service_role;

grant select, insert, update on table public.commerce_coupons to authenticated;
grant select on table public.commerce_order_discounts to authenticated;
grant select on table public.commerce_coupons to service_role;
grant select, insert on table public.commerce_order_discounts to service_role;

drop policy if exists "Admins manage commerce coupons"
  on public.commerce_coupons;
create policy "Admins manage commerce coupons"
on public.commerce_coupons
for all
to authenticated
using (public.is_catalog_admin())
with check (public.is_catalog_admin());

drop policy if exists "Admins read order discounts"
  on public.commerce_order_discounts;
create policy "Admins read order discounts"
on public.commerce_order_discounts
for select
to authenticated
using (public.is_catalog_admin());

-- Server-authoritative preview. The browser never sends an amount: the offer
-- price is selected from the approved commercial record inside PostgreSQL.
create or replace function public.quote_commerce_coupon(
  p_offer_id uuid,
  p_coupon_code text
)
returns table (
  result_valid boolean,
  result_reason text,
  result_coupon_id uuid,
  result_code text,
  result_name text,
  result_discount_percent integer,
  result_original_amount_cents integer,
  result_discount_amount_cents integer,
  result_final_amount_cents integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer public.commerce_offers%rowtype;
  v_coupon public.commerce_coupons%rowtype;
  v_discount integer;
begin
  select * into v_offer
  from public.commerce_offers
  where id = p_offer_id and status = 'approved';

  if not found then
    return query select false, 'offer-unavailable', null::uuid, null::text,
      null::text, null::integer, null::integer, null::integer, null::integer;
    return;
  end if;

  select * into v_coupon
  from public.commerce_coupons
  where code = upper(trim(p_coupon_code));

  if not found or v_coupon.status <> 'active' then
    return query select false, 'coupon-invalid', null::uuid, null::text,
      null::text, null::integer, v_offer.amount_cents, null::integer,
      v_offer.amount_cents;
    return;
  end if;
  if v_coupon.starts_at is not null and v_coupon.starts_at > now() then
    return query select false, 'coupon-not-started', v_coupon.id,
      v_coupon.code, v_coupon.name, v_coupon.discount_percent,
      v_offer.amount_cents, null::integer, v_offer.amount_cents;
    return;
  end if;
  if v_coupon.expires_at is not null and v_coupon.expires_at <= now() then
    return query select false, 'coupon-expired', v_coupon.id,
      v_coupon.code, v_coupon.name, v_coupon.discount_percent,
      v_offer.amount_cents, null::integer, v_offer.amount_cents;
    return;
  end if;
  if v_offer.amount_cents < v_coupon.minimum_amount_cents
     or v_offer.amount_cents <= 1 then
    return query select false, 'coupon-minimum', v_coupon.id,
      v_coupon.code, v_coupon.name, v_coupon.discount_percent,
      v_offer.amount_cents, null::integer, v_offer.amount_cents;
    return;
  end if;

  v_discount := least(
    v_offer.amount_cents - 1,
    greatest(1, round(v_offer.amount_cents * v_coupon.discount_percent / 100.0)::integer)
  );

  return query select true, 'ok', v_coupon.id, v_coupon.code, v_coupon.name,
    v_coupon.discount_percent, v_offer.amount_cents, v_discount,
    v_offer.amount_cents - v_discount;
end;
$$;

revoke all on function public.quote_commerce_coupon(uuid, text)
  from public, anon, authenticated;
grant execute on function public.quote_commerce_coupon(uuid, text)
  to service_role;

-- Creates the discounted order and its immutable coupon snapshot atomically.
-- Every amount is derived from the locked approved offer and coupon rows.
create or replace function public.create_discounted_commerce_order(
  p_id uuid,
  p_client_request_id uuid,
  p_external_id text,
  p_offer_id uuid,
  p_product_slug text,
  p_product_title text,
  p_payer_name text,
  p_payer_document_hash text,
  p_payer_document_last4 text,
  p_request_fingerprint_hash text,
  p_user_id uuid,
  p_coupon_code text
)
returns table (
  result_order_id uuid,
  result_client_request_id uuid,
  result_external_id text,
  result_offer_id uuid,
  result_product_slug text,
  result_product_title text,
  result_variant_name text,
  result_amount_cents integer,
  result_payer_name text,
  result_payer_document_hash text,
  result_user_id uuid,
  result_status text,
  result_coupon_code text,
  result_coupon_name text,
  result_discount_percent integer,
  result_original_amount_cents integer,
  result_discount_amount_cents integer,
  result_final_amount_cents integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_offer public.commerce_offers%rowtype;
  v_coupon public.commerce_coupons%rowtype;
  v_order public.commerce_orders%rowtype;
  v_snapshot public.commerce_order_discounts%rowtype;
  v_discount integer;
begin
  -- Serializes retries for the same browser request before any insert. This
  -- preserves exactly one order/snapshot even when two tabs submit together.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_client_request_id::text, 0)
  );

  select * into v_order
  from public.commerce_orders
  where client_request_id = p_client_request_id
  for update;

  if found then
    select * into v_snapshot
    from public.commerce_order_discounts
    where order_id = v_order.id;

    if not found then
      raise exception using errcode = 'P0001', message = 'coupon-request-conflict';
    end if;

    if v_order.offer_id <> p_offer_id
       or v_order.payer_name <> p_payer_name
       or v_order.payer_document_hash <> p_payer_document_hash
       or v_snapshot.coupon_code <> upper(trim(p_coupon_code)) then
      raise exception using errcode = 'P0001', message = 'coupon-request-conflict';
    end if;
  else
    select * into v_offer
    from public.commerce_offers
    where id = p_offer_id and status = 'approved'
    for update;
    if not found then
      raise exception using errcode = 'P0001', message = 'offer-unavailable';
    end if;

    select * into v_coupon
    from public.commerce_coupons
    where code = upper(trim(p_coupon_code))
    for update;
    if not found or v_coupon.status <> 'active' then
      raise exception using errcode = 'P0001', message = 'coupon-invalid';
    end if;
    if v_coupon.starts_at is not null and v_coupon.starts_at > now() then
      raise exception using errcode = 'P0001', message = 'coupon-not-started';
    end if;
    if v_coupon.expires_at is not null and v_coupon.expires_at <= now() then
      raise exception using errcode = 'P0001', message = 'coupon-expired';
    end if;
    if v_offer.amount_cents < v_coupon.minimum_amount_cents
       or v_offer.amount_cents <= 1 then
      raise exception using errcode = 'P0001', message = 'coupon-minimum';
    end if;

    v_discount := least(
      v_offer.amount_cents - 1,
      greatest(1, round(v_offer.amount_cents * v_coupon.discount_percent / 100.0)::integer)
    );

    insert into public.commerce_orders (
      id, client_request_id, external_id, offer_id, product_source_key,
      product_slug, product_title, variant_name, amount_cents, payer_name,
      payer_document_hash, payer_document_last4, request_fingerprint_hash,
      user_id, status
    ) values (
      p_id, p_client_request_id, p_external_id, v_offer.id,
      v_offer.product_source_key, p_product_slug, p_product_title,
      v_offer.variant_name, v_offer.amount_cents - v_discount, p_payer_name,
      p_payer_document_hash, p_payer_document_last4,
      p_request_fingerprint_hash, p_user_id, 'pending_payment'
    )
    returning * into v_order;

    insert into public.commerce_order_discounts (
      order_id, coupon_id, coupon_code, coupon_name, discount_percent,
      original_amount_cents, discount_amount_cents, final_amount_cents
    ) values (
      v_order.id, v_coupon.id, v_coupon.code, v_coupon.name,
      v_coupon.discount_percent, v_offer.amount_cents, v_discount,
      v_offer.amount_cents - v_discount
    )
    returning * into v_snapshot;
  end if;

  return query select
    v_order.id, v_order.client_request_id, v_order.external_id,
    v_order.offer_id, v_order.product_slug, v_order.product_title,
    v_order.variant_name, v_order.amount_cents, v_order.payer_name,
    v_order.payer_document_hash, v_order.user_id, v_order.status,
    v_snapshot.coupon_code, v_snapshot.coupon_name,
    v_snapshot.discount_percent, v_snapshot.original_amount_cents,
    v_snapshot.discount_amount_cents, v_snapshot.final_amount_cents;
end;
$$;

revoke all on function public.create_discounted_commerce_order(
  uuid, uuid, text, uuid, text, text, text, text, text, text, uuid, text
) from public, anon, authenticated;
grant execute on function public.create_discounted_commerce_order(
  uuid, uuid, text, uuid, text, text, text, text, text, text, uuid, text
) to service_role;
