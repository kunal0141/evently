# Evently

A premium, BookMyShow/Insider-style events platform: browse standup comedy,
concerts, workshops, conferences, theatre, sports and more, book a seat, or
host your own event in minutes. Built as an end-to-end demo of auth + CRUD +
a real business flow.

**Live app:** https://evently-evently4.vercel.app
**Test credentials:** `reviewer@evently.test` / `TestPass123!` (see "Test account" below)

## The problem it solves

Organizing or discovering a small event (a comedy show, a workshop, a meetup)
usually means a spreadsheet, a WhatsApp group, or a form with no capacity
limit. Evently gives a host a single link where people can browse by
category, see how many spots are left, and reserve one — and the host can
edit or cancel the event at any time.

## Core business flow

1. A host **signs up / logs in** and **hosts an event** — title, category
   (comedy, concerts, workshops, conferences, theatre, sports, movies, food,
   art, nightlife, kids…), description, venue, date/time, capacity, and price.
2. Anyone can **browse** — search, filter by category, or scroll the
   Netflix-style category rows on the browse page — and open an event to see
   full details and remaining spots.
3. A logged-in visitor **books a spot** — capacity is enforced atomically on
   the database side, so two people can't take the last seat at once.
4. The visitor can see their reservation under **My bookings** and
   **cancel** it if their plans change, freeing the spot back up.
5. The host can see their events under **My events**, and **edit** or
   **delete** them at any time.

## Features

- **Auth** — email/password sign up, log in, log out (Supabase Auth).
- **CRUD** — full create / read / update / delete on the `events` entity,
  scoped to the event's host via Postgres Row Level Security.
- **Business flow** — book / cancel a seat on an event, with server-side
  capacity checks (see `book_event()` in `supabase/schema.sql`).
- **Categories & pricing** — 12 event categories, each with its own banner
  gradient, plus free/paid pricing shown throughout.
- **Search & filtering** — a search bar and category filter chips on the
  browse page; the default view groups events into horizontally-scrolling
  rows per category (Netflix/BookMyShow-style), switching to a filtered
  grid when searching or filtering.
- **Premium dark theme** — a maroon/red-on-black theme, a custom SVG logo
  and favicon, and a display font for headings.

## Tech stack

- **Next.js 16** (App Router, Server Components, Server Actions, Proxy, TypeScript)
- **Supabase** — Postgres database, Auth, and Row Level Security
- **Tailwind CSS v4** for styling
- **Vercel** for hosting
- Built with the help of an AI pair-programming assistant (Claude Code) for
  scaffolding, the Postgres schema/RLS policies, page implementation, and
  the visual redesign.

## Project structure

```
src/
  app/
    page.tsx                 landing page
    login/, signup/           auth pages + server actions
    actions.ts                logout server action
    icon.svg                  favicon / app icon
    events/
      page.tsx                browse events (search, category rows/grid)
      new/page.tsx             host an event
      [id]/page.tsx            event detail + book/cancel
      [id]/edit/page.tsx       edit event
      actions.ts                create/update/delete event, book/cancel booking
    my-events/page.tsx         events you host
    bookings/page.tsx          events you've booked
  components/                  NavBar, Logo, EventForm, EventCard
  lib/
    supabase/                  browser / server / proxy Supabase clients
    categories.ts              category metadata (label, emoji, gradient)
    dates.ts                   small date helpers
  types/                       shared TypeScript types
src/proxy.ts                    refreshes the auth session, protects routes
                                 (Next.js 16's renamed Middleware)
supabase/
  schema.sql                    full DB schema, RLS policies, booking RPC
  002_add_category_and_price.sql  migration for DBs created before categories
```

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com)
   (free tier is enough).

3. **Run the schema.** Open the Supabase dashboard → SQL Editor → paste the
   contents of [`supabase/schema.sql`](supabase/schema.sql) → Run. This
   creates the `events` and `bookings` tables (including `category` and
   `price_cents`), Row Level Security policies, and the `book_event()`
   function used to atomically enforce capacity.

   (If you already ran `schema.sql` before categories/pricing existed, run
   [`supabase/002_add_category_and_price.sql`](supabase/002_add_category_and_price.sql)
   instead — it adds the new columns without touching existing data.)

4. **Turn off email confirmation** (so you and reviewers can sign up and log
   in immediately): Supabase dashboard → Authentication → Sign In / Providers
   → Email → turn off "Confirm email".

5. **Copy the environment file** and fill in your project's API URL and anon
   /publishable key (Supabase dashboard → Project Settings → API):

   ```bash
   cp .env.local.example .env.local
   ```

6. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Test account

For reviewers, either sign up with any email/password (email confirmation is
disabled, so this works instantly), or use the seeded account below, which
already hosts a full catalog of ~24 sample events across every category:

```
email:    reviewer@evently.test
password: TestPass123!
```

## Known limitations

- Email confirmation is disabled for ease of review — in a production app
  this would be re-enabled.
- No image uploads for events (category banners use gradient + emoji
  instead of photos) yet.
- No payment integration — "price" is informational; booking doesn't charge
  a card.
- No pagination — the events list loads everything in one page.
- Browsing events currently requires being logged in (Row Level Security
  restricts `events` reads to authenticated users) — a public,
  logged-out browse view would be a natural next step.
