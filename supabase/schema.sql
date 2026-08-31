-- Evently database schema
-- Run this whole file once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

create extension if not exists "pgcrypto";

-- ========== EVENTS (core CRUD entity) ==========
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  host_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 120),
  description text not null default '',
  location    text not null default '',
  event_time  timestamptz not null,
  capacity    int not null check (capacity >= 1),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists events_event_time_idx on public.events (event_time);
create index if not exists events_host_id_idx on public.events (host_id);

-- ========== BOOKINGS (core business-flow entity) ==========
create table if not exists public.bookings (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  status     text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists bookings_user_id_idx on public.bookings (user_id);
create index if not exists bookings_event_id_idx on public.bookings (event_id);

-- keep updated_at fresh on events
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- ========== RLS ==========
alter table public.events enable row level security;
alter table public.bookings enable row level security;

-- anyone signed in can browse all events
drop policy if exists "events are viewable by authenticated users" on public.events;
create policy "events are viewable by authenticated users"
  on public.events for select
  to authenticated
  using (true);

-- only the host can create/update/delete their own events
drop policy if exists "hosts can insert their own events" on public.events;
create policy "hosts can insert their own events"
  on public.events for insert
  to authenticated
  with check (host_id = auth.uid());

drop policy if exists "hosts can update their own events" on public.events;
create policy "hosts can update their own events"
  on public.events for update
  to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

drop policy if exists "hosts can delete their own events" on public.events;
create policy "hosts can delete their own events"
  on public.events for delete
  to authenticated
  using (host_id = auth.uid());

-- a user can see their own bookings; a host can see bookings on their events
drop policy if exists "users can view their own bookings" on public.bookings;
create policy "users can view their own bookings"
  on public.bookings for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.events e where e.id = event_id and e.host_id = auth.uid())
  );

-- users cancel (delete) their own bookings
drop policy if exists "users can cancel their own bookings" on public.bookings;
create policy "users can cancel their own bookings"
  on public.bookings for delete
  to authenticated
  using (user_id = auth.uid());

-- direct inserts are blocked; bookings are created via the book_event() RPC
-- below (security definer) so capacity can be checked atomically.

-- ========== book_event RPC ==========
-- Atomically checks remaining capacity and inserts a booking, avoiding a
-- race condition between "check spots left" and "insert booking".
create or replace function public.book_event(p_event_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity int;
  v_booked   int;
  v_booking  public.bookings;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select capacity into v_capacity from public.events where id = p_event_id for update;
  if v_capacity is null then
    raise exception 'Event not found';
  end if;

  select count(*) into v_booked
  from public.bookings
  where event_id = p_event_id and status = 'confirmed';

  if v_booked >= v_capacity then
    raise exception 'Event is fully booked';
  end if;

  insert into public.bookings (event_id, user_id)
  values (p_event_id, auth.uid())
  on conflict (event_id, user_id) do update set status = 'confirmed'
  returning * into v_booking;

  return v_booking;
end;
$$;

grant execute on function public.book_event(uuid) to authenticated;
