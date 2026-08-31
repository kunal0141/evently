import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPastIso } from "@/lib/dates";
import { isSeatable } from "@/lib/tiers";
import BookingFlow from "@/components/BookingFlow";

export default async function BookEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/events/${id}/book`)}`);

  const { data: event } = await supabase.from("events").select("*").eq("id", id).single();
  if (!event) notFound();
  if (!isSeatable(event.category)) redirect(`/events/${id}`);
  if (event.host_id === user.id) redirect(`/events/${id}`);
  if (isPastIso(event.event_time)) redirect(`/events/${id}`);

  const { data: seatBookings } = await supabase
    .from("bookings")
    .select("tier_key, seat_label")
    .eq("event_id", id)
    .eq("status", "confirmed")
    .not("seat_label", "is", null);

  const takenSeats: Record<string, string[]> = {};
  for (const b of seatBookings ?? []) {
    if (!b.tier_key || !b.seat_label) continue;
    (takenSeats[b.tier_key] ??= []).push(b.seat_label);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_balance_cents")
    .eq("user_id", user.id)
    .single();

  return (
    <BookingFlow
      event={event}
      takenSeats={takenSeats}
      walletBalanceCents={profile?.wallet_balance_cents ?? 0}
    />
  );
}
