import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EventCard from "@/components/EventCard";
import type { Event, EventWithCounts } from "@/types";

export default async function MyEventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // middleware already redirects

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("host_id", user.id)
    .order("event_time", { ascending: true });

  const eventIds = (events ?? []).map((e: Event) => e.id);
  const { data: bookings } = eventIds.length
    ? await supabase
        .from("bookings")
        .select("event_id")
        .in("event_id", eventIds)
        .eq("status", "confirmed")
    : { data: [] as { event_id: string }[] };

  const countByEvent = new Map<string, number>();
  for (const b of bookings ?? []) {
    countByEvent.set(b.event_id, (countByEvent.get(b.event_id) || 0) + 1);
  }

  const enriched: EventWithCounts[] = (events ?? []).map((e: Event) => ({
    ...e,
    booked_count: countByEvent.get(e.id) || 0,
    my_booking_id: null,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-wide text-text">My events</h1>
        <Link
          href="/events/new"
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover"
        >
          + New event
        </Link>
      </div>

      {enriched.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-text-muted">You haven&apos;t created any events yet.</p>
          <Link
            href="/events/new"
            className="mt-3 inline-block rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Host your first event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {enriched.map((event) => (
            <EventCard key={event.id} event={event} isMine />
          ))}
        </div>
      )}
    </div>
  );
}
