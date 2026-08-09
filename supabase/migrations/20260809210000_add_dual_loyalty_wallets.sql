-- ============================================================================
-- 6DNX — duas carteiras fechadas de recompensa + operação administrativa
--
-- REQUER: 20260806100000_add_user_fidelity.sql
-- STATUS: VERSIONADA, NÃO APLICADA. Validar com ROLLBACK e autorização humana.
--
-- `slot`      = moeda consumível apenas pelas experiências 6DNX futuras.
-- `community` = 6DNX Coins administrados por Maycon e trocados via suporte.
-- Nenhuma carteira representa BRL, permite saque ou conversão em dinheiro.
-- Esta migration também DESLIGA o crédito automático por compra. Qualquer
-- emissão passa a ser explícita e auditável até a regra comercial ser homologada.
-- ============================================================================

-- 1. Separar os saldos por carteira sem perder eventuais registros legados.
alter table public.loyalty_ledger
  add column if not exists wallet text not null default 'slot',
  add column if not exists actor_user_id uuid references auth.users(id) on delete set null,
  add column if not exists actor_user_id_snapshot uuid,
  add column if not exists note text,
  add column if not exists request_id uuid;

alter table public.loyalty_ledger
  drop constraint if exists loyalty_ledger_wallet_check;
alter table public.loyalty_ledger
  add constraint loyalty_ledger_wallet_check
  check (wallet in ('slot', 'community'));
alter table public.loyalty_ledger
  drop constraint if exists loyalty_ledger_note_check;
alter table public.loyalty_ledger
  add constraint loyalty_ledger_note_check
  check (note is null or char_length(note) <= 240);

drop index if exists public.uq_ledger_source;
create unique index uq_ledger_source
  on public.loyalty_ledger(user_id, wallet, reason, source_ref)
  where source_ref is not null;
create unique index if not exists uq_loyalty_ledger_request
  on public.loyalty_ledger(request_id)
  where request_id is not null;
create index if not exists idx_ledger_user_wallet
  on public.loyalty_ledger(user_id, wallet, created_at desc);
create index if not exists idx_ledger_actor_user
  on public.loyalty_ledger(actor_user_id);

alter table public.loyalty_balances
  add column if not exists wallet text not null default 'slot';
alter table public.loyalty_balances
  drop constraint if exists chk_loyalty_balance_wallet;
alter table public.loyalty_balances
  add constraint chk_loyalty_balance_wallet
  check (wallet in ('slot', 'community'));
alter table public.loyalty_balances
  drop constraint if exists loyalty_balances_pkey;
alter table public.loyalty_balances
  add constraint loyalty_balances_pkey primary key (user_id, wallet);

alter table public.loyalty_balance_log
  add column if not exists wallet text not null default 'slot',
  add column if not exists actor_user_id uuid references auth.users(id) on delete set null,
  add column if not exists actor_user_id_snapshot uuid,
  add column if not exists note text,
  add column if not exists request_id uuid;
alter table public.loyalty_balance_log
  drop constraint if exists loyalty_balance_log_wallet_check;
alter table public.loyalty_balance_log
  add constraint loyalty_balance_log_wallet_check
  check (wallet in ('slot', 'community'));
alter table public.loyalty_balance_log
  drop constraint if exists loyalty_balance_log_note_check;
alter table public.loyalty_balance_log
  add constraint loyalty_balance_log_note_check
  check (note is null or char_length(note) <= 240);
create index if not exists idx_balance_log_user_wallet
  on public.loyalty_balance_log(user_id, wallet, created_at desc);
create index if not exists idx_balance_log_actor_user
  on public.loyalty_balance_log(actor_user_id);

-- 2. Nenhuma compra credita qualquer carteira por acidente. A futura regra de
-- compra/feedback exige confirmação de feedback e será uma etapa própria.
drop trigger if exists trg_credit_loyalty_on_order_paid on public.commerce_orders;

-- Compatibilidade: a função legada, se chamada explicitamente pelo servidor,
-- credita somente a carteira da Slot. Não existe chamada automática nesta fase.
create or replace function public.credit_loyalty_coins(
  p_user_id uuid,
  p_delta bigint,
  p_reason text,
  p_source_ref text default null
)
returns public.loyalty_balances
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new public.loyalty_balances;
  v_prev bigint;
begin
  if p_delta <= 0 then
    raise exception 'delta must be positive' using errcode = '22023';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'reason required' using errcode = '22023';
  end if;

  insert into public.loyalty_balances (user_id, wallet, balance)
  values (p_user_id, 'slot', 0)
  on conflict on constraint loyalty_balances_pkey do nothing;

  select b.balance into v_prev
  from public.loyalty_balances as b
  where b.user_id = p_user_id and b.wallet = 'slot'
  for update;

  if p_source_ref is not null and exists (
    select 1
    from public.loyalty_ledger as l
    where l.user_id = p_user_id
      and l.wallet = 'slot'
      and l.reason = p_reason
      and l.source_ref = p_source_ref
  ) then
    select b.* into v_new
    from public.loyalty_balances as b
    where b.user_id = p_user_id and b.wallet = 'slot';
    return v_new;
  end if;

  insert into public.loyalty_ledger
    (user_id, wallet, delta, reason, source_ref)
  values (p_user_id, 'slot', p_delta, p_reason, p_source_ref);

  update public.loyalty_balances as b
  set balance = b.balance + p_delta,
      updated_at = clock_timestamp()
  where b.user_id = p_user_id and b.wallet = 'slot'
  returning * into v_new;

  insert into public.loyalty_balance_log
    (user_id, wallet, previous_balance, new_balance, delta, reason, source_ref)
  values
    (p_user_id, 'slot', v_prev, v_new.balance, p_delta, p_reason, p_source_ref);

  return v_new;
end;
$$;

-- 3. Busca administrativa limitada. Nenhuma chave service-role vai ao browser.
create or replace function public.admin_list_loyalty_users(
  p_query text default null,
  p_limit integer default 80
)
returns table (
  user_id uuid,
  email text,
  display_name text,
  discord_display_name text,
  slot_balance bigint,
  community_balance bigint,
  latest_activity timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_query text := nullif(btrim(p_query), '');
  v_limit integer := least(greatest(coalesce(p_limit, 80), 1), 100);
begin
  if not public.is_catalog_admin() then
    raise exception 'admin required' using errcode = '42501';
  end if;
  if coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  return query
  select
    u.id,
    u.email::text,
    coalesce(
      nullif(u.raw_user_meta_data ->> 'full_name', ''),
      nullif(u.raw_user_meta_data ->> 'name', ''),
      nullif(u.raw_user_meta_data ->> 'preferred_username', ''),
      split_part(coalesce(u.email, ''), '@', 1),
      'Usuário 6DNX'
    )::text,
    p.discord_display_name,
    coalesce(sb.balance, 0)::bigint,
    coalesce(cb.balance, 0)::bigint,
    greatest(
      u.created_at,
      coalesce(sb.updated_at, u.created_at),
      coalesce(cb.updated_at, u.created_at)
    )
  from auth.users as u
  left join public.user_profiles as p on p.user_id = u.id
  left join public.loyalty_balances as sb
    on sb.user_id = u.id and sb.wallet = 'slot'
  left join public.loyalty_balances as cb
    on cb.user_id = u.id and cb.wallet = 'community'
  where v_query is null
     or u.email ilike '%' || v_query || '%'
     or coalesce(u.raw_user_meta_data ->> 'full_name', '') ilike '%' || v_query || '%'
     or coalesce(u.raw_user_meta_data ->> 'name', '') ilike '%' || v_query || '%'
     or coalesce(u.raw_user_meta_data ->> 'preferred_username', '') ilike '%' || v_query || '%'
     or coalesce(p.discord_display_name, '') ilike '%' || v_query || '%'
  order by greatest(
    u.created_at,
    coalesce(sb.updated_at, u.created_at),
    coalesce(cb.updated_at, u.created_at)
  ) desc
  limit v_limit;
end;
$$;

-- 4. Ajuste atômico e idempotente. O saldo nunca pode ficar negativo e todo
-- movimento grava ator, motivo, observação, request_id e antes/depois.
create or replace function public.admin_adjust_loyalty_wallet(
  p_user_id uuid,
  p_wallet text,
  p_delta bigint,
  p_reason text,
  p_note text default null,
  p_request_id uuid default gen_random_uuid()
)
returns table (
  wallet text,
  previous_balance bigint,
  new_balance bigint,
  applied boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_previous bigint;
  v_new bigint;
  v_existing_user uuid;
  v_existing_wallet text;
  v_existing_delta bigint;
  v_existing_reason text;
  v_existing_note text;
begin
  if not public.is_catalog_admin() then
    raise exception 'admin required' using errcode = '42501';
  end if;
  if coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then
    raise exception 'aal2 required' using errcode = '42501';
  end if;
  if p_request_id is null then
    raise exception 'request id required' using errcode = '22023';
  end if;
  if p_wallet not in ('slot', 'community') then
    raise exception 'invalid wallet' using errcode = '22023';
  end if;
  if p_delta = 0 or abs(p_delta) > 1000000 then
    raise exception 'invalid delta' using errcode = '22023';
  end if;
  if p_reason not in (
    'manual_credit',
    'manual_debit',
    'purchase_feedback',
    'correction'
  ) then
    raise exception 'invalid reason' using errcode = '22023';
  end if;
  if p_delta > 0 and p_reason = 'manual_debit' then
    raise exception 'credit reason does not match delta' using errcode = '22023';
  end if;
  if p_delta < 0 and p_reason in ('manual_credit', 'purchase_feedback') then
    raise exception 'debit reason does not match delta' using errcode = '22023';
  end if;
  if p_note is not null and char_length(p_note) > 240 then
    raise exception 'note too long' using errcode = '22023';
  end if;
  if not exists (select 1 from auth.users as u where u.id = p_user_id) then
    raise exception 'user not found' using errcode = 'P0002';
  end if;

  -- Serializa retries concorrentes pela chave idempotente antes da primeira
  -- leitura. A mesma requisição devolve applied=false em vez de disputar o
  -- índice único e terminar em 23505.
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));

  select l.user_id, l.wallet, l.delta, l.reason, coalesce(l.note, '')
  into v_existing_user, v_existing_wallet, v_existing_delta,
       v_existing_reason, v_existing_note
  from public.loyalty_ledger as l
  where l.request_id = p_request_id;
  if found then
    if v_existing_user <> p_user_id
       or v_existing_wallet <> p_wallet
       or v_existing_delta <> p_delta
       or v_existing_reason <> p_reason
       or v_existing_note <> coalesce(nullif(btrim(p_note), ''), '') then
      raise exception 'request id collision' using errcode = '23505';
    end if;
    select b.balance into v_new
    from public.loyalty_balances as b
    where b.user_id = v_existing_user and b.wallet = v_existing_wallet;
    return query select v_existing_wallet, v_new, v_new, false;
    return;
  end if;

  insert into public.loyalty_balances (user_id, wallet, balance)
  values (p_user_id, p_wallet, 0)
  on conflict on constraint loyalty_balances_pkey do nothing;

  select b.balance into v_previous
  from public.loyalty_balances as b
  where b.user_id = p_user_id and b.wallet = p_wallet
  for update;

  v_new := v_previous + p_delta;
  if v_new < 0 then
    raise exception 'insufficient balance' using errcode = '23514';
  end if;

  insert into public.loyalty_ledger
    (user_id, wallet, delta, reason, actor_user_id, actor_user_id_snapshot,
     note, request_id)
  values
    (p_user_id, p_wallet, p_delta, p_reason, auth.uid(), auth.uid(),
     nullif(btrim(p_note), ''), p_request_id);

  update public.loyalty_balances as b
  set balance = v_new,
      updated_at = clock_timestamp()
  where b.user_id = p_user_id and b.wallet = p_wallet;

  insert into public.loyalty_balance_log
    (user_id, wallet, previous_balance, new_balance, delta, reason,
     actor_user_id, actor_user_id_snapshot, note, request_id)
  values
    (p_user_id, p_wallet, v_previous, v_new, p_delta, p_reason,
     auth.uid(), auth.uid(), nullif(btrim(p_note), ''), p_request_id);

  return query select p_wallet, v_previous, v_new, true;
end;
$$;

-- 5. O cliente não consulta ledger/log brutos. Esses registros contêm nota,
-- ator e request_id internos. O saldo próprio continua legível; a tela usa a
-- API server-side e a administração usa as RPCs acima.
drop policy if exists "Ledger próprio" on public.loyalty_ledger;
drop policy if exists "Log próprio" on public.loyalty_balance_log;
drop policy if exists "Admin lê ledger de fidelidade" on public.loyalty_ledger;

drop policy if exists "Admin lê saldos de fidelidade" on public.loyalty_balances;

drop policy if exists "Admin lê auditoria de fidelidade" on public.loyalty_balance_log;

-- Grants e RLS são camadas distintas no Data API. O backend de /api/account
-- consulta o saldo com a chave server-side; declarar o privilégio evita depender
-- dos default privileges do projeto Supabase.
grant select on public.loyalty_balances to authenticated, service_role;
revoke select on public.loyalty_ledger, public.loyalty_balance_log
  from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public.loyalty_ledger, public.loyalty_balances, public.loyalty_balance_log
  from anon, authenticated, service_role;

revoke all on function public.admin_list_loyalty_users(text, integer)
  from public, anon, authenticated;
grant execute on function public.admin_list_loyalty_users(text, integer)
  to authenticated;

revoke all on function public.admin_adjust_loyalty_wallet(uuid, text, bigint, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.admin_adjust_loyalty_wallet(uuid, text, bigint, text, text, uuid)
  to authenticated;
