-- 009_audit_fixes.sql
--
-- Fixes from the June 2026 connection/bug audit. Idempotent.
--
--  1. Event seat accounting: admin cancel/delete of an RSVP never restored
--     bocage_events.seats_remaining, so events falsely showed "Sold Out".
--     New SECURITY DEFINER RPCs mutate the booking + adjust the seat atomically
--     (members have no UPDATE on bocage_events). bocage_event_rsvp also now lets
--     a member re-RSVP after cancelling.
--  2. Couples-tier partner could not read the shared house account ($0.00 bug):
--     add partner read policies.
--  3. (data) primary_email backfilled from auth.users for members missing it —
--     see the matching migration applied to production; re-runnable safely.

-- ── 1. Event seat accounting ────────────────────────────────────────────────
create or replace function public.bocage_admin_set_rsvp_status(p_booking_id uuid, p_status text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_event uuid; v_old text;
begin
  if not public.bocage_is_admin() then raise exception 'not authorized'; end if;
  select event_id, status into v_event, v_old
    from public.bocage_event_bookings where id = p_booking_id for update;
  if not found then raise exception 'rsvp not found'; end if;

  update public.bocage_event_bookings set status = p_status where id = p_booking_id;

  if p_status = 'cancelled' and v_old is distinct from 'cancelled' then
    update public.bocage_events
       set seats_remaining = least(seats_remaining + 1, coalesce(max_seats, seats_remaining + 1)),
           updated_at = now()
     where id = v_event and seats_remaining is not null;
  elsif p_status <> 'cancelled' and v_old = 'cancelled' then
    update public.bocage_events
       set seats_remaining = greatest(seats_remaining - 1, 0), updated_at = now()
     where id = v_event and seats_remaining is not null;
  end if;

  return jsonb_build_object('ok', true);
end; $$;

create or replace function public.bocage_admin_delete_rsvp(p_booking_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_event uuid; v_old text;
begin
  if not public.bocage_is_admin() then raise exception 'not authorized'; end if;
  select event_id, status into v_event, v_old
    from public.bocage_event_bookings where id = p_booking_id for update;
  if not found then return jsonb_build_object('ok', true); end if;

  delete from public.bocage_event_bookings where id = p_booking_id;

  if v_old is distinct from 'cancelled' then
    update public.bocage_events
       set seats_remaining = least(seats_remaining + 1, coalesce(max_seats, seats_remaining + 1)),
           updated_at = now()
     where id = v_event and seats_remaining is not null;
  end if;

  return jsonb_build_object('ok', true);
end; $$;

revoke execute on function public.bocage_admin_set_rsvp_status(uuid,text) from public, anon;
revoke execute on function public.bocage_admin_delete_rsvp(uuid) from public, anon;
grant  execute on function public.bocage_admin_set_rsvp_status(uuid,text) to authenticated, service_role;
grant  execute on function public.bocage_admin_delete_rsvp(uuid) to authenticated, service_role;

create or replace function public.bocage_event_rsvp(p_event_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_seats integer;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select seats_remaining into v_seats
    from public.bocage_events where id = p_event_id and is_active = true for update;
  if not found then raise exception 'event not found'; end if;

  if exists (select 1 from public.bocage_event_bookings
               where user_id = v_uid and event_id = p_event_id and status is distinct from 'cancelled') then
    return jsonb_build_object('status', 'already', 'seats_remaining', v_seats);
  end if;

  if v_seats is not null and v_seats <= 0 then
    return jsonb_build_object('status', 'full', 'seats_remaining', 0);
  end if;

  insert into public.bocage_event_bookings (user_id, event_id, status)
    values (v_uid, p_event_id, 'confirmed')
    on conflict (user_id, event_id) do update set status = 'confirmed';

  if v_seats is not null then
    update public.bocage_events
       set seats_remaining = seats_remaining - 1, updated_at = now()
     where id = p_event_id
    returning seats_remaining into v_seats;
  end if;

  return jsonb_build_object('status', 'booked', 'seats_remaining', v_seats);
end; $$;

-- ── 2. Couples-tier partner can read the shared house account ────────────────
drop policy if exists bocage_house_accounts_select_partner on public.bocage_house_accounts;
create policy bocage_house_accounts_select_partner on public.bocage_house_accounts
  for select using (
    exists (select 1 from public.bocage_memberships m
            where m.user_id = bocage_house_accounts.profile_id
              and m.partner_user_id = auth.uid())
  );

drop policy if exists bocage_house_transactions_select_partner on public.bocage_house_transactions;
create policy bocage_house_transactions_select_partner on public.bocage_house_transactions
  for select using (
    exists (select 1 from public.bocage_house_accounts a
            join public.bocage_memberships m on m.user_id = a.profile_id
            where a.id = bocage_house_transactions.account_id
              and m.partner_user_id = auth.uid())
  );

-- ── 3. Backfill primary_email (so CRM reset/email works for invited members) ─
update public.bocage_memberships m
   set primary_email = u.email
  from auth.users u
 where m.user_id = u.id
   and (m.primary_email is null or m.primary_email = '');
