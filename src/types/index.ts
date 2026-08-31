import type { CategoryId } from "@/lib/categories";

export type Event = {
  id: string;
  host_id: string;
  title: string;
  description: string;
  location: string;
  event_time: string; // ISO timestamp
  capacity: number;
  category: CategoryId;
  price_cents: number;
  created_at: string;
  updated_at: string;
};

export type Booking = {
  id: string;
  event_id: string;
  user_id: string;
  status: "confirmed" | "cancelled";
  created_at: string;
};

export type EventWithCounts = Event & {
  booked_count: number;
  my_booking_id: string | null;
};
