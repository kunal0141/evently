import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { getCategory, formatPrice } from "@/lib/categories";
import { getShowsForMovie } from "@/lib/tiers";
import type { Event } from "@/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  });
}

type BookingRow = {
  id: string;
  event_id: string;
  user_id: string;
  tier_key: string | null;
  class_name: string | null;
  seat_label: string | null;
  price_cents: number;
  created_at: string;
  events: Event | null;
};

export default async function TicketPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/tickets/${bookingId}`)}`);

  const { data } = await supabase
    .from("bookings")
    .select("id, event_id, user_id, tier_key, class_name, seat_label, price_cents, created_at, events(*)")
    .eq("id", bookingId)
    .eq("status", "confirmed")
    .single();

  const booking = data as unknown as BookingRow | null;
  if (!booking || !booking.events) notFound();
  if (booking.user_id !== user.id) redirect("/bookings");

  const event = booking.events;
  const category = getCategory(event.category);

  const qrPayload = JSON.stringify({
    ticket: booking.id,
    event: event.title,
    when: event.event_time,
    where: event.location,
    seat: booking.seat_label ?? "General Admission",
    price: booking.price_cents,
  });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    margin: 1,
    width: 220,
    color: { dark: "#0a0a0b", light: "#f5f5f2" },
  });

  let venueLine = event.location || null;
  if (event.category === "movies" && booking.tier_key?.includes("::")) {
    const showKey = booking.tier_key.split("::")[0];
    const show = getShowsForMovie(event).find((s) => s.key === showKey);
    if (show) venueLine = `${show.theatre} · ${show.format} · ${show.time}`;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <Link href="/bookings" className="mb-6 inline-block text-sm text-text-muted hover:text-text">
        ← My bookings
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/40">
        <div
          className="relative flex h-32 items-center justify-center"
          style={{ background: category.gradient }}
        >
          <span className="text-5xl drop-shadow-2xl">{category.emoji}</span>
          <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            {category.label}
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <h1 className="font-display text-2xl leading-tight tracking-wide text-text">{event.title}</h1>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-text-faint">Date &amp; time</p>
              <p className="mt-0.5 text-text">{formatDate(event.event_time)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-text-faint">Venue</p>
              <p className="mt-0.5 text-text">{venueLine ?? "TBA"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-text-faint">
                {booking.seat_label ? "Seat" : "Admission"}
              </p>
              <p className="mt-0.5 text-text">
                {booking.seat_label ?? "General"}
                {booking.class_name && (
                  <span className="ml-1.5 text-text-muted">({booking.class_name})</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-text-faint">Price paid</p>
              <p className="mt-0.5 font-semibold text-text">{formatPrice(booking.price_cents)}</p>
            </div>
          </div>

          <div className="my-6 border-t border-dashed border-border" />

          <div className="flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- server-generated data: URI, next/image can't optimize this */}
            <img
              src={qrDataUrl}
              alt="Ticket QR code"
              width={160}
              height={160}
              className="rounded-lg border border-border bg-[#f5f5f2] p-2"
            />
            <p className="mt-3 text-center text-xs text-text-faint">
              Show this QR code at entry
            </p>
            <p className="mt-1 font-mono text-[11px] text-text-faint">
              Ticket #{booking.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-text-faint">
        Booked {new Date(booking.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
      </p>
    </div>
  );
}
