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
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">My events</h1>
        <Link
          href="/events/new"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          + New event
        </Link>
      </div>

      {enriched.length === 0 ? (
        <p className="text-sm text-neutral-500">
          You haven&apos;t created any events yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {enriched.map((event) => (
            <EventCard key={event.id} event={event} isMine />
          ))}
        </div>
      )}
    </div>
  );
}
