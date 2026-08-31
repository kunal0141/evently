import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EventCard from "@/components/EventCard";
import { isPastIso } from "@/lib/dates";
import type { Event, EventWithCounts } from "@/types";

export default async function EventsPage() {
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Browse events</h1>

      {upcoming.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No upcoming events yet. Be the first to{" "}
          <Link href="/events/new" className="underline">
            create one
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {upcoming.map((event) => (
            <EventCard key={event.id} event={event} isMine={event.host_id === user?.id} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="mb-4 mt-10 text-lg font-medium text-neutral-700">Past events</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 opacity-60">
            {past.map((event) => (
              <EventCard key={event.id} event={event} isMine={event.host_id === user?.id} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
