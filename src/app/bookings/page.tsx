import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cancelBooking } from "../events/actions";
import type { Event } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type BookingRow = {
  id: string;
  event_id: string;
  events: Event | null;
};

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // middleware already redirects

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, event_id, events(*)")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .order("id");

  const rows = (bookings ?? []) as unknown as BookingRow[];
  const withEvents = rows.filter((b) => b.events);
  const sorted = withEvents.sort(
    (a, b) => new Date(a.events!.event_time).getTime() - new Date(b.events!.event_time).getTime()
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">My bookings</h1>

      {sorted.length === 0 ? (
        <p className="text-sm text-neutral-500">
          You haven&apos;t booked any events yet.{" "}
          <Link href="/events" className="underline">
            Browse events
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 p-4"
            >
              <div>
                <Link href={`/events/${b.event_id}`} className="font-medium text-neutral-900 hover:underline">
                  {b.events!.title}
                </Link>
                <p className="text-sm text-neutral-500">{formatDate(b.events!.event_time)}</p>
                {b.events!.location && (
                  <p className="text-sm text-neutral-500">📍 {b.events!.location}</p>
                )}
              </div>
              <form action={cancelBooking}>
                <input type="hidden" name="bookingId" value={b.id} />
                <input type="hidden" name="eventId" value={b.event_id} />
                <button
                  type="submit"
                  className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Cancel
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
