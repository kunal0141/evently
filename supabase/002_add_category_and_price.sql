-- Migration: adds category + price to events.
-- Run this in Supabase SQL Editor on a project that already has the
-- original schema.sql applied. Safe to run more than once.

alter table public.events
  add column if not exists category text not null default 'other',
  add column if not exists price_cents int not null default 0;

alter table public.events drop constraint if exists events_price_cents_check;
alter table public.events
  add constraint events_price_cents_check check (price_cents >= 0);

alter table public.events drop constraint if exists events_category_check;
alter table public.events
  add constraint events_category_check check (
    category in (
      'movies', 'comedy', 'concerts', 'workshops', 'conferences',
      'theatre', 'sports', 'food', 'art', 'nightlife', 'kids', 'other'
    )
  );

create index if not exists events_category_idx on public.events (category);
