import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cancelBooking } from "../events/actions";
import { getCategory, formatPrice } from "@/lib/categories";
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
  seat_label: string | null;
  class_name: string | null;
  price_cents: number;
  events: Event | null;
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ purchased?: string }>;
}) {
  const { purchased } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // proxy already redirects

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, event_id, seat_label, class_name, price_cents, events(*)")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .order("id");

  const rows = (bookings ?? []) as unknown as BookingRow[];
  const withEvents = rows.filter((b) => b.events);
  const sorted = withEvents.sort(
    (a, b) => new Date(a.events!.event_time).getTime() - new Date(b.events!.event_time).getTime()
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 font-display text-3xl tracking-wide text-text">My bookings</h1>
      {purchased && (
        <p className="mb-4 rounded-lg border border-success/30 bg-success-soft px-3.5 py-2.5 text-sm text-success">
          Tickets booked! Open one below to see your e-ticket and QR code.
        </p>
      )}
      <div className="mb-6" />

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-text-muted">You haven&apos;t booked any events yet.</p>
          <Link
            href="/events"
            className="mt-3 inline-block rounded-full bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Browse events
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {sorted.map((b) => {
            const category = getCategory(b.events!.category);
            return (
              <li
                key={b.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4"
              >
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-2xl"
                  style={{ background: category.gradient }}
                >
                  {category.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/events/${b.event_id}`}
                    className="font-medium text-text hover:text-primary-hover hover:underline"
                  >
                    {b.events!.title}
                  </Link>
                  <p className="text-sm text-text-muted">{formatDate(b.events!.event_time)}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-text-faint">
                    {b.seat_label ? (
                      <span>
                        Seat {b.seat_label}
                        {b.class_name ? ` · ${b.class_name}` : ""}
                      </span>
                    ) : (
                      b.events!.location && <span>📍 {b.events!.location}</span>
                    )}
                    <span className="font-medium text-text-muted">{formatPrice(b.price_cents)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Link
                    href={`/tickets/${b.id}`}
                    className="rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-primary-hover"
                  >
                    View ticket
                  </Link>
                  <form action={cancelBooking}>
                    <input type="hidden" name="bookingId" value={b.id} />
                    <input type="hidden" name="eventId" value={b.event_id} />
                    <button
                      type="submit"
                      className="rounded-full border border-danger/40 px-3.5 py-1 text-xs font-medium text-danger transition hover:bg-danger-soft"
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
