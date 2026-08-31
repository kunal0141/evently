import Link from "next/link";
import type { EventWithCounts } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function EventCard({
  event,
  isMine,
}: {
  event: EventWithCounts;
  isMine: boolean;
}) {
  const spotsLeft = event.capacity - event.booked_count;
  const isFull = spotsLeft <= 0;

  return (
    <Link
      href={`/events/${event.id}`}
      className="block rounded-lg border border-neutral-200 p-4 transition hover:border-neutral-400"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-neutral-900">{event.title}</h3>
        {isMine && (
          <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
            Hosting
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-neutral-500">{formatDate(event.event_time)}</p>
      {event.location && (
        <p className="mt-0.5 text-sm text-neutral-500">📍 {event.location}</p>
      )}
      <p
        className={`mt-2 text-xs font-medium ${
          isFull ? "text-red-600" : "text-neutral-600"
        }`}
      >
        {isFull ? "Fully booked" : `${spotsLeft} of ${event.capacity} spots left`}
      </p>
      {event.my_booking_id && (
        <p className="mt-1 text-xs font-medium text-emerald-600">You&apos;re booked in</p>
      )}
    </Link>
  );
}
