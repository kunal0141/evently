"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function toTimestamp(dateLocal: string) {
  // dateLocal comes from an <input type="datetime-local"> e.g. "2026-09-12T18:30"
  return new Date(dateLocal).toISOString();
}

// ---------- CRUD: create ----------
export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const eventTime = String(formData.get("event_time") || "");
  const capacity = Number(formData.get("capacity") || 0);

  if (!title || !eventTime || !capacity || capacity < 1) {
    redirect(
      `/events/new?error=${encodeURIComponent(
        "Title, date/time, and a capacity of at least 1 are required."
      )}`
    );
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      host_id: user!.id,
      title,
      description,
      location,
      event_time: toTimestamp(eventTime),
      capacity,
    })
    .select("id")
    .single();

  if (error) {
    redirect(`/events/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/events");
  revalidatePath("/my-events");
  redirect(`/events/${data!.id}?message=${encodeURIComponent("Event created.")}`);
}

// ---------- CRUD: update ----------
export async function updateEvent(eventId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const eventTime = String(formData.get("event_time") || "");
  const capacity = Number(formData.get("capacity") || 0);

  if (!title || !eventTime || !capacity || capacity < 1) {
    redirect(
      `/events/${eventId}/edit?error=${encodeURIComponent(
        "Title, date/time, and a capacity of at least 1 are required."
      )}`
    );
  }

  const { error } = await supabase
    .from("events")
    .update({
      title,
      description,
      location,
      event_time: toTimestamp(eventTime),
      capacity,
    })
    .eq("id", eventId)
    .eq("host_id", user!.id); // RLS also enforces this; belt & suspenders

  if (error) {
    redirect(`/events/${eventId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/events");
  revalidatePath("/my-events");
  revalidatePath(`/events/${eventId}`);
  redirect(`/events/${eventId}?message=${encodeURIComponent("Event updated.")}`);
}

// ---------- CRUD: delete ----------
export async function deleteEvent(formData: FormData) {
  const eventId = String(formData.get("eventId") || "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("events").delete().eq("id", eventId).eq("host_id", user!.id);

  revalidatePath("/events");
  revalidatePath("/my-events");
  redirect("/my-events");
}

// ---------- Business flow: book a spot ----------
export async function bookEvent(formData: FormData) {
  const eventId = String(formData.get("eventId") || "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("book_event", { p_event_id: eventId });

  revalidatePath("/events");
  revalidatePath("/bookings");
  revalidatePath(`/events/${eventId}`);

  if (error) {
    redirect(`/events/${eventId}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/events/${eventId}?message=${encodeURIComponent("You're booked in!")}`);
}

// ---------- Business flow: cancel a booking ----------
export async function cancelBooking(formData: FormData) {
  const bookingId = String(formData.get("bookingId") || "");
  const eventId = String(formData.get("eventId") || "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("bookings").delete().eq("id", bookingId).eq("user_id", user!.id);

  revalidatePath("/events");
  revalidatePath("/bookings");
  if (eventId) revalidatePath(`/events/${eventId}`);
  redirect("/bookings");
}
