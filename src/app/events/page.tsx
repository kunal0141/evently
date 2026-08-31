import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EventCard from "@/components/EventCard";
import { isPastIso } from "@/lib/dates";
import { CATEGORIES, getCategory } from "@/lib/categories";
import type { Event, EventWithCounts } from "@/types";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category: activeCategory, q } = await searchParams;
  const query = (q || "").trim().toLowerCase();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("event_time", { ascending: true });

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, event_id, user_id")
    .eq("status", "confirmed");

  const countByEvent = new Map<string, number>();
  const myBookingByEvent = new Map<string, string>();
  for (const b of bookings ?? []) {
    countByEvent.set(b.event_id, (countByEvent.get(b.event_id) || 0) + 1);
    if (user && b.user_id === user.id) myBookingByEvent.set(b.event_id, b.id);
  }

  const enriched: EventWithCounts[] = (events ?? []).map((e: Event) => ({
    ...e,
    booked_count: countByEvent.get(e.id) || 0,
    my_booking_id: myBookingByEvent.get(e.id) || null,
  }));

  const upcoming = enriched.filter((e) => !isPastIso(e.event_time));
  const past = enriched.filter((e) => isPastIso(e.event_time));

  const matchesQuery = (e: EventWithCounts) =>
    !query ||
    e.title.toLowerCase().includes(query) ||
    e.location.toLowerCase().includes(query) ||
    getCategory(e.category).label.toLowerCase().includes(query);

  const filtered = upcoming.filter(
    (e) => (!activeCategory || e.category === activeCategory) && matchesQuery(e)
  );

  const isBrowsingAll = !activeCategory && !query;

  const categoryCounts = new Map<string, number>();
  for (const e of upcoming) {
    categoryCounts.set(e.category, (categoryCounts.get(e.category) || 0) + 1);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Search */}
      <form action="/events" method="get" className="mb-5">
        {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint">
            🔍
          </span>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search comedy shows, concerts, workshops, venues…"
            className="w-full rounded-full border border-border bg-surface py-3 pl-10 pr-4 text-sm text-text placeholder:text-text-faint outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
        </div>
      </form>

      {/* Category chips */}
      <div className="scroll-row -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <Link
          href="/events"
          className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
            !activeCategory
              ? "border-primary bg-primary text-white"
              : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text"
          }`}
        >
          All events
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            href={`/events?category=${c.id}`}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              activeCategory === c.id
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text"
            }`}
          >
            {c.emoji} {c.label}
          </Link>
        ))}
      </div>

      {isBrowsingAll ? (
        <BrowseRows events={upcoming} categoryCounts={categoryCounts} userId={user?.id} />
      ) : (
        <FilteredGrid
          events={filtered}
          userId={user?.id}
          heading={
            activeCategory ? getCategory(activeCategory).label : `Results for "${q}"`
          }
        />
      )}

      {isBrowsingAll && past.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-xl tracking-wide text-text-muted">
            Past events
          </h2>
          <div className="scroll-row flex gap-4 overflow-x-auto pb-2 opacity-50">
            {past.slice(0, 12).map((event) => (
              <div key={event.id} className="w-56 shrink-0 sm:w-64">
                <EventCard event={event} isMine={event.host_id === user?.id} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BrowseRows({
  events,
  categoryCounts,
  userId,
}: {
  events: EventWithCounts[];
  categoryCounts: Map<string, number>;
  userId?: string;
}) {
  if (events.length === 0) {
    return <EmptyState />;
  }

  const orderedCategories = CATEGORIES.filter((c) => (categoryCounts.get(c.id) || 0) > 0);

  return (
    <div className="flex flex-col gap-9">
      {orderedCategories.map((c) => {
        const rowEvents = events.filter((e) => e.category === c.id);
        if (rowEvents.length === 0) return null;
        return (
          <section key={c.id}>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-xl tracking-wide text-text">
                {c.emoji} {c.label}
              </h2>
              {rowEvents.length > 6 && (
                <Link
                  href={`/events?category=${c.id}`}
                  className="text-xs font-medium text-text-muted hover:text-primary-hover"
                >
                  See all {rowEvents.length} →
                </Link>
              )}
            </div>
            <div className="scroll-row flex gap-4 overflow-x-auto pb-2">
              {rowEvents.slice(0, 10).map((event) => (
                <div key={event.id} className="w-56 shrink-0 sm:w-64">
                  <EventCard event={event} isMine={event.host_id === userId} />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function FilteredGrid({
  events,
  userId,
  heading,
}: {
  events: EventWithCounts[];
  userId?: string;
  heading: string;
}) {
  return (
    <section>
      <h2 className="mb-4 font-display text-xl tracking-wide text-text">
        {heading} <span className="text-text-faint">({events.length})</span>
      </h2>
      {events.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} isMine={event.host_id === userId} />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border py-16 text-center">
      <p className="text-text-muted">No events found.</p>
      <Link
        href="/events/new"
        className="mt-3 inline-block rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
      >
        Be the first to host one
      </Link>
    </div>
  );
}
