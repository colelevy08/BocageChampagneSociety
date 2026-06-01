-- 008_sync_production_schema.sql
--
-- Reconciles the repo migration history with the live production database
-- (Sure Thing Hospitality, project ref peecuaxyygkvakcnjgoo). A number of
-- columns and functions were added directly against the live DB after the
-- original 001–007 migrations diverged from it (the membership purchase flow,
-- birthdays/anniversaries/tiers, event categories + seating, house-account
-- linking, wine favorites, and the atomic credit/RSVP RPCs). This migration
-- captures all of that so a fresh replay reproduces production.
--
-- Every statement is idempotent (add column if not exists / create or replace /
-- drop policy if exists), so it is safe to run against an already-current DB.

-- ─────────────────────────────────────────────────────────────────────────────
-- Columns
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.bocage_profiles add column if not exists birthday date;
alter table public.bocage_profiles add column if not exists push_token text;

alter table public.bocage_memberships add column if not exists tier text;
alter table public.bocage_memberships add column if not exists purchase_amount_cents integer;
alter table public.bocage_memberships add column if not exists credit_issued_cents integer;
alter table public.bocage_memberships add column if not exists square_order_id text;
alter table public.bocage_memberships add column if not exists square_payment_link_id text;
alter table public.bocage_memberships add column if not exists square_checkout_url text;
alter table public.bocage_memberships add column if not exists partner_user_id uuid;
alter table public.bocage_memberships add column if not exists last_error text;
alter table public.bocage_memberships add column if not exists purchased_at timestamp with time zone;
alter table public.bocage_memberships add column if not exists primary_name text;
alter table public.bocage_memberships add column if not exists primary_email text;
alter table public.bocage_memberships add column if not exists partner_name text;
alter table public.bocage_memberships add column if not exists partner_email text;
alter table public.bocage_memberships add column if not exists welcome_sent_at timestamp with time zone;
alter table public.bocage_memberships add column if not exists primary_birthday date;
alter table public.bocage_memberships add column if not exists partner_birthday date;
alter table public.bocage_memberships add column if not exists anniversary_date date;

alter table public.bocage_events add column if not exists max_seats integer;
alter table public.bocage_events add column if not exists seats_remaining integer;
alter table public.bocage_events add column if not exists price numeric(10,2);
alter table public.bocage_events add column if not exists event_category text;
alter table public.bocage_events add column if not exists access_mode text;
alter table public.bocage_events add column if not exists members_first_until timestamp with time zone;

alter table public.bocage_house_accounts add column if not exists toast_account_id text;
alter table public.bocage_house_accounts add column if not exists linked_at timestamp with time zone;

alter table public.bocage_house_transactions add column if not exists created_by uuid;

-- ─────────────────────────────────────────────────────────────────────────────
-- Functions
-- ─────────────────────────────────────────────────────────────────────────────

-- Most-favorited wines (powers the Menu "popular" view). SECURITY DEFINER so
-- the aggregate counts across all members without exposing individual rows.
create or replace function public.bocage_wine_favorite_counts()
returns table(wine_id uuid, favorite_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select f.wine_id, count(*)::bigint
  from public.bocage_wine_favorites f
  group by f.wine_id;
$$;

-- Atomic house-account credit/debit. Inserts the ledger row and moves the
-- balance in one transaction (no read-modify-write race), idempotent on
-- square_order_id, with a server-side overdraft guard. p_amount is the SIGNED
-- balance delta; the ledger row stores abs(p_amount) with p_type as direction.
-- Callable only by service_role (server) or a signed-in admin.
create or replace function public.bocage_house_account_credit(
  p_account_id uuid,
  p_amount numeric,
  p_type text,
  p_description text default null,
  p_square_order_id text default null,
  p_created_by uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx_id uuid;
  v_balance numeric;
begin
  if auth.role() = 'authenticated' and not public.bocage_is_admin() then
    raise exception 'not authorized to modify house account';
  end if;

  begin
    insert into public.bocage_house_transactions
      (account_id, type, amount, description, square_order_id, created_by)
    values (p_account_id, p_type, abs(p_amount), p_description, p_square_order_id, p_created_by)
    returning id into v_tx_id;
  exception when unique_violation then
    select balance into v_balance from public.bocage_house_accounts where id = p_account_id;
    return jsonb_build_object('applied', false, 'reason', 'duplicate', 'balance', v_balance);
  end;

  update public.bocage_house_accounts
     set balance = balance + p_amount, updated_at = now()
   where id = p_account_id and balance + p_amount >= 0
  returning balance into v_balance;

  if not found then
    if exists (select 1 from public.bocage_house_accounts where id = p_account_id) then
      raise exception 'insufficient balance';
    else
      raise exception 'house account % not found', p_account_id;
    end if;
  end if;

  return jsonb_build_object('applied', true, 'balance', v_balance, 'transaction_id', v_tx_id);
end;
$$;

revoke execute on function public.bocage_house_account_credit(uuid,numeric,text,text,text,uuid) from public, anon;
grant  execute on function public.bocage_house_account_credit(uuid,numeric,text,text,text,uuid) to authenticated, service_role;

-- Atomic event RSVP. Locks the event row, checks capacity (NULL = unlimited),
-- books the seat (idempotent on the unique (user_id,event_id)), and decrements
-- seats_remaining — all in one transaction. SECURITY DEFINER because members
-- have no UPDATE policy on bocage_events.
create or replace function public.bocage_event_rsvp(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_seats integer;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select seats_remaining into v_seats
    from public.bocage_events
   where id = p_event_id and is_active = true
   for update;
  if not found then
    raise exception 'event not found';
  end if;

  if exists (select 1 from public.bocage_event_bookings
               where user_id = v_uid and event_id = p_event_id) then
    return jsonb_build_object('status', 'already', 'seats_remaining', v_seats);
  end if;

  if v_seats is not null and v_seats <= 0 then
    return jsonb_build_object('status', 'full', 'seats_remaining', 0);
  end if;

  insert into public.bocage_event_bookings (user_id, event_id)
    values (v_uid, p_event_id)
    on conflict (user_id, event_id) do nothing;

  if v_seats is not null then
    update public.bocage_events
       set seats_remaining = seats_remaining - 1, updated_at = now()
     where id = p_event_id
    returning seats_remaining into v_seats;
  end if;

  return jsonb_build_object('status', 'booked', 'seats_remaining', v_seats);
end;
$$;

revoke execute on function public.bocage_event_rsvp(uuid) from public, anon;
grant  execute on function public.bocage_event_rsvp(uuid) to authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS hardening (mirrors the lockdown applied to production)
-- ─────────────────────────────────────────────────────────────────────────────
-- These tables had permissive `for insert with check (true)` policies open to
-- the anon role. Their only writers (the SECURITY DEFINER signup trigger and
-- the service-role webhook) bypass RLS, so the policies granted nothing
-- legitimate and let anyone with the anon key insert rows.
drop policy if exists bocage_profiles_insert_service     on public.bocage_profiles;
drop policy if exists bocage_memberships_insert_service  on public.bocage_memberships;
drop policy if exists bocage_house_accounts_insert_service on public.bocage_house_accounts;

-- The signup trigger fn should only fire as a trigger, never via PostgREST RPC.
revoke execute on function public.bocage_handle_new_user() from public, anon, authenticated;
