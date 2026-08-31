# Evently

A tiny events platform: create an event with a limited number of seats, browse
what's on, and book (or cancel) your spot. Built as an end-to-end demo of
auth + CRUD + a real business flow.

**Live app:** https://evently-evently4.vercel.app
**Test credentials:** `reviewer@evently.test` / `TestPass123!` (see "Test account" below)

## The problem it solves

Organizing a small event (a meetup, a workshop, a study session) usually
means a spreadsheet, a WhatsApp group, or a form with no capacity limit.
Evently gives a host a single link where people can see the event, see how
many spots are left, and reserve one — and the host can edit or cancel the
event at any time.

## Core business flow

1. A host **signs up / logs in** and **creates an event** (title, description,
   location, date/time, capacity).
2. Anyone can **browse** the list of upcoming events and open one to see
   details and remaining spots.
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

## Tech stack

- **Next.js 16** (App Router, Server Components, Server Actions, TypeScript)
- **Supabase** — Postgres database, Auth, and Row Level Security
- **Tailwind CSS** for styling
- **Vercel** for hosting
- Built with the help of an AI pair-programming assistant (Claude Code) for
  scaffolding, the Postgres schema/RLS policies, and page implementation.

## Project structure

```
src/
  app/
    page.tsx                landing page
    login/, signup/          auth pages + server actions
    actions.ts               logout server action
    events/
      page.tsx               browse events
      new/page.tsx            create event
      [id]/page.tsx           event detail + book/cancel
      [id]/edit/page.tsx      edit event
      actions.ts               create/update/delete event, book/cancel booking
    my-events/page.tsx        events you host
    bookings/page.tsx         events you've booked
  components/                 NavBar, EventForm, EventCard
  lib/supabase/               browser / server / middleware Supabase clients
  types/                      shared TypeScript types
middleware.ts                  refreshes the auth session, protects routes
supabase/schema.sql             full DB schema, RLS policies, booking RPC
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
   creates the `events` and `bookings` tables, Row Level Security policies,
   and the `book_event()` function used to atomically enforce capacity.

4. **Turn off email confirmation** (so you and reviewers can sign up and log
   in immediately): Supabase dashboard → Authentication → Sign In / Providers
   → Email → turn off "Confirm email".

5. **Copy the environment file** and fill in your project's API URL and anon
   key (Supabase dashboard → Project Settings → API):

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
already hosts two sample events:

```
email:    reviewer@evently.test
password: TestPass123!
```

## Known limitations

- Email confirmation is disabled for ease of review — in a production app
  this would be re-enabled.
- No image uploads for events (text-only listings) yet.
- No pagination — the events list loads everything in one page.
