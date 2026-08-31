import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPastIso } from "@/lib/dates";
import { getCategory, formatPrice } from "@/lib/categories";
import { bookEvent, cancelBooking, deleteEvent } from "../actions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  });
}

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { id } = await params;
  const { error, message } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: event } = await supabase.from("events").select("*").eq("id", id).single();
  if (!event) notFound();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, user_id")
    .eq("event_id", id)
    .eq("status", "confirmed");

  const bookedCount = bookings?.length ?? 0;
  const myBooking = bookings?.find((b) => b.user_id === user?.id);
  const isHost = user?.id === event.host_id;
  const spotsLeft = event.capacity - bookedCount;
  const isFull = spotsLeft <= 0;
  const isPast = isPastIso(event.event_time);
  const category = getCategory(event.category);
  const pctFull = Math.min(100, Math.round((bookedCount / event.capacity) * 100));

  return (
    <div className="animate-fade-in pb-16">
      {/* Hero banner */}
      <div
        className="relative flex h-52 items-center justify-center overflow-hidden sm:h-64"
        style={{ background: category.gradient }}
      >
        <span className="text-7xl drop-shadow-2xl sm:text-8xl">{category.emoji}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-black/10" />
        <Link
          href="/events"
          className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1.5 text-sm text-white backdrop-blur-sm transition hover:bg-black/60"
        >
          ← Browse
        </Link>
      </div>

      <div className="mx-auto -mt-10 max-w-2xl px-4 sm:px-6">
        {message && (
          <p className="mb-4 rounded-lg border border-success/30 bg-success-soft px-3.5 py-2.5 text-sm text-success">
            {message}
          </p>
        )}
        {error && (
          <p className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xl shadow-black/40 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="mb-2 inline-block rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary-hover">
                {category.emoji} {category.label}
              </span>
              <h1 className="font-display text-3xl leading-tight tracking-wide text-text sm:text-4xl">
                {event.title}
              </h1>
            </div>
            {isHost && (
              <div className="flex shrink-0 gap-3 pt-1 text-sm">
                <Link href={`/events/${event.id}/edit`} className="text-text-muted underline hover:text-text">
                  Edit
                </Link>
                <form action={deleteEvent}>
                  <input type="hidden" name="eventId" value={event.id} />
                  <button type="submit" className="text-danger underline hover:text-danger/80">
                    Delete
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-1.5 text-sm text-text-muted">
            <p>🗓️ {formatDate(event.event_time)}</p>
            {event.location && <p>📍 {event.location}</p>}
            <p className="text-base font-semibold text-text">{formatPrice(event.price_cents)}</p>
          </div>

          {event.description && (
            <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-text-muted">
              {event.description}
            </p>
          )}

          <div className="mt-6 rounded-xl border border-border bg-bg-elevated p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className={`text-sm font-medium ${isFull ? "text-danger" : "text-text"}`}>
                {isFull ? "Sold out" : `${spotsLeft} of ${event.capacity} spots left`}
              </p>
              <span className="text-xs text-text-faint">{bookedCount} booked</span>
            </div>
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pctFull}%` }}
              />
            </div>

            {isPast ? (
              <p className="text-sm text-text-faint">This event has already happened.</p>
            ) : !user ? (
              <Link
                href={`/login?next=${encodeURIComponent(`/events/${event.id}`)}`}
                className="inline-block w-full rounded-lg bg-primary py-3 text-center text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover"
              >
                Log in to book
              </Link>
            ) : isHost ? (
              <p className="text-sm text-text-faint">You&apos;re hosting this event.</p>
            ) : myBooking ? (
              <form action={cancelBooking}>
                <input type="hidden" name="bookingId" value={myBooking.id} />
                <input type="hidden" name="eventId" value={event.id} />
                <button
                  type="submit"
                  className="w-full rounded-lg border border-danger/40 py-3 text-sm font-semibold text-danger transition hover:bg-danger-soft"
                >
                  Cancel my booking
                </button>
              </form>
            ) : (
              <form action={bookEvent}>
                <input type="hidden" name="eventId" value={event.id} />
                <button
                  type="submit"
                  disabled={isFull}
                  className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  {isFull ? "Sold out" : `Book my spot · ${formatPrice(event.price_cents)}`}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
