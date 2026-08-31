import Link from "next/link";
import type { EventWithCounts } from "@/types";
import { getCategory, formatPrice } from "@/lib/categories";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function EventCard({
  event,
  isMine,
}: {
  event: EventWithCounts;
  isMine: boolean;
}) {
  const category = getCategory(event.category);
  const spotsLeft = event.capacity - event.booked_count;
  const isFull = spotsLeft <= 0;
  const almostFull = !isFull && spotsLeft <= Math.max(2, Math.ceil(event.capacity * 0.1));

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block shrink-0 overflow-hidden rounded-xl border border-border bg-surface transition duration-200 hover:-translate-y-1 hover:border-border-strong hover:shadow-2xl hover:shadow-black/40"
    >
      <div
        className="relative flex h-32 items-center justify-center overflow-hidden"
        style={{ background: category.gradient }}
      >
        <span className="text-5xl drop-shadow-lg transition duration-200 group-hover:scale-110">
          {category.emoji}
        </span>
        <span className="absolute left-2 top-2 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          {category.label}
        </span>
        {isMine && (
          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-bg">
            Hosting
          </span>
        )}
        {isFull && (
          <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-danger">
            Sold out
          </span>
        )}
        {almostFull && (
          <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-white">
            Only {spotsLeft} left
          </span>
        )}
      </div>

      <div className="p-3.5">
        <h3 className="line-clamp-1 font-semibold text-text">{event.title}</h3>
        <p className="mt-1 text-xs text-text-muted">
          {formatDate(event.event_time)} · {formatTime(event.event_time)}
        </p>
        {event.location && (
          <p className="mt-0.5 line-clamp-1 text-xs text-text-faint">📍 {event.location}</p>
        )}
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-text">
            {formatPrice(event.price_cents)}
          </span>
          {event.my_booking_id ? (
            <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success">
              Booked
            </span>
          ) : (
            <span className="text-[11px] text-text-faint">
              {isFull ? "Full" : `${spotsLeft}/${event.capacity} left`}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
