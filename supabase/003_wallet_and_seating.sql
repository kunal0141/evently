-- Migration: adds a test-money wallet per user, and seat/tier/price columns
-- on bookings so a booking can represent a specific seat in a specific
-- price class (Silver/Gold/Platinum) instead of just "one general spot".
-- Run this in Supabase SQL Editor. Safe to run more than once.

-- ========== WALLET ==========
create table if not exists public.profiles (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  wallet_balance_cents  bigint not null default 10000000, -- ₹1,00,000 test balance
  created_at            timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "users can view their own profile" on public.profiles;
create policy "users can view their own profile"
  on public.profiles for select
  to authenticated
  using (user_id = auth.uid());

-- profiles.wallet_balance_cents is only ever changed by the security-definer
-- RPCs below (book_event / book_seats / top_up_wallet), never by a direct
-- client update, so no UPDATE policy is granted to authenticated users.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- backfill profiles for any users created before this migration
insert into public.profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;

create or replace function public.top_up_wallet(p_amount_cents int default 1000000)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  update public.profiles
    set wallet_balance_cents = wallet_balance_cents + greatest(p_amount_cents, 0)
    where user_id = auth.uid()
    returning * into v_profile;
  return v_profile;
end;
$$;

grant execute on function public.top_up_wallet(int) to authenticated;

-- ========== SEATED BOOKINGS ==========
alter table public.bookings
  add column if not exists tier_key   text,
  add column if not exists class_name text,
  add column if not exists seat_label text,
  add column if not exists price_cents int not null default 0;

-- The original schema had `unique (event_id, user_id)`, which only allows
-- one booking per user per event ever — fine for general admission, wrong
-- once a user can hold several distinct seats on the same event. Replace it
-- with two partial unique indexes: at most one *general-admission* booking
-- (seat_label is null) per user per event, and each specific seat can only
-- ever be booked once.
alter table public.bookings drop constraint if exists bookings_event_id_user_id_key;

create unique index if not exists bookings_general_admission_unique
  on public.bookings (event_id, user_id)
  where seat_label is null;

create unique index if not exists bookings_seat_unique
  on public.bookings (event_id, tier_key, seat_label)
  where seat_label is not null;

-- ========== book_event: now also debits the wallet ==========
create or replace function public.book_event(p_event_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity int;
  v_booked   int;
  v_price    int;
  v_balance  int;
  v_booking  public.bookings;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select capacity, price_cents into v_capacity, v_price
    from public.events where id = p_event_id for update;
  if v_capacity is null then
    raise exception 'Event not found';
  end if;

  select count(*) into v_booked
    from public.bookings
    where event_id = p_event_id and status = 'confirmed' and seat_label is null;

  if v_booked >= v_capacity then
    raise exception 'Event is fully booked';
  end if;

  select wallet_balance_cents into v_balance
    from public.profiles where user_id = auth.uid() for update;
  if v_balance is null then
    raise exception 'Wallet not found';
  end if;
  if v_balance < coalesce(v_price, 0) then
    raise exception 'Insufficient wallet balance';
  end if;

  update public.profiles
    set wallet_balance_cents = wallet_balance_cents - coalesce(v_price, 0)
    where user_id = auth.uid();

  insert into public.bookings (event_id, user_id, status, price_cents)
  values (p_event_id, auth.uid(), 'confirmed', coalesce(v_price, 0))
  on conflict (event_id, user_id) where seat_label is null
    do update set status = 'confirmed'
  returning * into v_booking;

  return v_booking;
end;
$$;

grant execute on function public.book_event(uuid) to authenticated;

-- ========== book_seats: pick specific seats in a tier ==========
create or replace function public.book_seats(
  p_event_id uuid,
  p_tier_key text,
  p_class_name text,
  p_seats text[],
  p_price_per_seat_cents int
)
returns setof public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total   bigint;
  v_balance bigint;
  v_count   int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  v_count := coalesce(array_length(p_seats, 1), 0);
  if v_count < 1 then
    raise exception 'No seats selected';
  end if;

  v_total := p_price_per_seat_cents::bigint * v_count;

  select wallet_balance_cents into v_balance
    from public.profiles where user_id = auth.uid() for update;
  if v_balance is null then
    raise exception 'Wallet not found';
  end if;
  if v_balance < v_total then
    raise exception 'Insufficient wallet balance';
  end if;

  update public.profiles
    set wallet_balance_cents = wallet_balance_cents - v_total
    where user_id = auth.uid();

  -- Inserting all seats in one statement means a duplicate seat (already
  -- taken, or picked twice by mistake) raises immediately and rolls back
  -- the whole booking — including the wallet debit above — atomically.
  return query
    insert into public.bookings
      (event_id, user_id, status, tier_key, class_name, seat_label, price_cents)
    select p_event_id, auth.uid(), 'confirmed', p_tier_key, p_class_name, s, p_price_per_seat_cents
    from unnest(p_seats) as s
    returning *;
end;
$$;

grant execute on function public.book_seats(uuid, text, text, text[], int) to authenticated;

-- ========== cancel_booking: cancels + refunds the wallet ==========
create or replace function public.cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_price int;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.bookings
    where id = p_booking_id and user_id = auth.uid()
    returning price_cents into v_price;

  if v_price is null then
    raise exception 'Booking not found';
  end if;

  update public.profiles
    set wallet_balance_cents = wallet_balance_cents + v_price
    where user_id = auth.uid();
end;
$$;

grant execute on function public.cancel_booking(uuid) to authenticated;
