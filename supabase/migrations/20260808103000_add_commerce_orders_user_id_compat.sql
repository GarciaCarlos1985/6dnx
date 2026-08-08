-- 6DNX emergency compatibility migration.
--
-- Restores the contract expected by the deployed checkout and account order
-- list without enabling rewards, balances, games, or commercial triggers.
-- Anonymous purchases remain valid because user_id is nullable.

alter table public.commerce_orders
  add column if not exists user_id uuid null
  references auth.users(id) on delete set null;

create index if not exists idx_orders_user
  on public.commerce_orders(user_id);

drop policy if exists "Authenticated users read own commerce orders"
  on public.commerce_orders;

create policy "Authenticated users read own commerce orders"
  on public.commerce_orders
  for select
  to authenticated
  using (user_id = auth.uid());

comment on column public.commerce_orders.user_id is
  'Authenticated buyer linked to the order; null preserves anonymous checkout.';
