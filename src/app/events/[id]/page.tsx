import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPastIso } from "@/lib/dates";
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {message && (
        <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-neutral-900">{event.title}</h1>
        {isHost && (
          <div className="flex shrink-0 gap-3 text-sm">
            <Link href={`/events/${event.id}/edit`} className="text-neutral-600 underline">
              Edit
            </Link>
            <form action={deleteEvent}>
              <input type="hidden" name="eventId" value={event.id} />
              <button type="submit" className="text-red-600 underline">
                Delete
              </button>
            </form>
          </div>
        )}
      </div>

      <p className="mt-2 text-neutral-600">{formatDate(event.event_time)}</p>
      {event.location && <p className="mt-1 text-neutral-600">📍 {event.location}</p>}

      {event.description && (
        <p className="mt-6 whitespace-pre-wrap text-neutral-700">{event.description}</p>
      )}

      <div className="mt-6 rounded-lg border border-neutral-200 p-4">
        <p className={`text-sm font-medium ${isFull ? "text-red-600" : "text-neutral-700"}`}>
          {isFull ? "Fully booked" : `${spotsLeft} of ${event.capacity} spots left`}
        </p>

        {isPast ? (
          <p className="mt-3 text-sm text-neutral-500">This event has already happened.</p>
        ) : !user ? (
          <Link
            href={`/login?next=${encodeURIComponent(`/events/${event.id}`)}`}
            className="mt-3 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Log in to book
          </Link>
        ) : isHost ? (
          <p className="mt-3 text-sm text-neutral-500">You&apos;re hosting this event.</p>
        ) : myBooking ? (
          <form action={cancelBooking} className="mt-3">
            <input type="hidden" name="bookingId" value={myBooking.id} />
            <input type="hidden" name="eventId" value={event.id} />
            <button
              type="submit"
              className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Cancel my booking
            </button>
          </form>
        ) : (
          <form action={bookEvent} className="mt-3">
            <input type="hidden" name="eventId" value={event.id} />
            <button
              type="submit"
              disabled={isFull}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isFull ? "Fully booked" : "Book my spot"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
