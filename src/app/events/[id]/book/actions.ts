"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BookSeatsResult =
  | { ok: true; bookingIds: string[] }
  | { ok: false; error: string };

export async function bookSeats(
  eventId: string,
  tierKey: string,
  className: string,
  seats: string[],
  pricePerSeatCents: number
): Promise<BookSeatsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You need to be logged in to book seats." };
  }
  if (!seats.length) {
    return { ok: false, error: "Pick at least one seat first." };
  }

  const { data, error } = await supabase.rpc("book_seats", {
    p_event_id: eventId,
    p_tier_key: tierKey,
    p_class_name: className,
    p_seats: seats,
    p_price_per_seat_cents: pricePerSeatCents,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/bookings");
  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/book`);

  const bookingIds = (data ?? []).map((b: { id: string }) => b.id);
  return { ok: true, bookingIds };
}
