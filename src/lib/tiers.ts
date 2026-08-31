import type { Event } from "@/types";

// Categories that get an interactive seat/stand map instead of a single
// "Book my spot" button.
const SEATABLE = new Set(["movies", "sports", "concerts", "theatre"]);
export function isSeatable(category: string): boolean {
  return SEATABLE.has(category);
}

export type SeatClass = "silver" | "gold" | "platinum";

export const CLASS_LABEL: Record<SeatClass, string> = {
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

export type Show = {
  key: string; // stable id, e.g. "0-3d"
  theatre: string;
  format: string; // "2D" | "3D" | "4DX"
  time: string; // display time, e.g. "2:30 PM"
};

/**
 * Movies only: a handful of plausible (theatre, format, showtime) options,
 * generated deterministically from the event so the list is stable across
 * requests without needing extra database rows.
 */
export function getShowsForMovie(event: Pick<Event, "event_time">): Show[] {
  const base = new Date(event.event_time);
  const theatres: { name: string; formats: string[] }[] = [
    { name: "PVR Cinemas", formats: ["2D", "3D", "4DX"] },
    { name: "INOX Movies", formats: ["2D", "3D"] },
  ];
  const offsetsMin = [-150, 0, 195, 330];

  const shows: Show[] = [];
  theatres.forEach((t, ti) => {
    t.formats.forEach((format, fi) => {
      const offset = offsetsMin[(ti * 2 + fi) % offsetsMin.length];
      const time = new Date(base.getTime() + offset * 60000);
      shows.push({
        key: `${ti}-${format.toLowerCase()}`,
        theatre: t.name,
        format,
        // Fixed locale + time zone (this app is India-focused) so the
        // server-rendered and client-hydrated text always match — using
        // the visitor's own locale/zone here would make BookingFlow (a
        // client component, so its markup is both SSR'd and hydrated)
        // render differently in each environment and trigger a hydration
        // mismatch whenever they differ.
        time: time.toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "Asia/Kolkata",
        }),
      });
    });
  });
  return shows;
}

export type Tier = {
  key: string;
  name: string;
  seatClass: SeatClass;
  priceCents: number;
  rows: number;
  seatsPerRow: number;
};

/**
 * The price/seat-class tiers available for a given event. For movies, pass
 * the chosen `showKey` so 3D/4DX can carry a format premium.
 */
export function getTiersForEvent(
  event: Pick<Event, "category" | "price_cents">,
  showKey?: string
): Tier[] {
  const base = Math.max(event.price_cents || 15000, 15000); // floor ~₹150 so the map always feels real

  if (event.category === "movies") {
    const mult = showKey?.includes("4dx") ? 1.6 : showKey?.includes("3d") ? 1.25 : 1;
    return [
      { key: "silver", name: "Silver", seatClass: "silver", priceCents: Math.round(base * mult), rows: 5, seatsPerRow: 12 },
      { key: "gold", name: "Gold", seatClass: "gold", priceCents: Math.round(base * mult * 1.7), rows: 3, seatsPerRow: 10 },
    ];
  }

  if (event.category === "sports") {
    return [
      { key: "general", name: "General Stand", seatClass: "silver", priceCents: Math.round(base * 0.5), rows: 6, seatsPerRow: 14 },
      { key: "silver-stand", name: "Silver Stand", seatClass: "silver", priceCents: base, rows: 5, seatsPerRow: 12 },
      { key: "gold-stand", name: "Gold Stand", seatClass: "gold", priceCents: Math.round(base * 1.8), rows: 4, seatsPerRow: 10 },
      { key: "premium-pavilion", name: "Premium Pavilion", seatClass: "platinum", priceCents: Math.round(base * 3), rows: 3, seatsPerRow: 8 },
    ];
  }

  // concerts & theatre
  return [
    { key: "silver-balcony", name: "Silver · Balcony", seatClass: "silver", priceCents: base, rows: 5, seatsPerRow: 12 },
    { key: "gold-stalls", name: "Gold · Stalls", seatClass: "gold", priceCents: Math.round(base * 1.7), rows: 4, seatsPerRow: 10 },
    { key: "platinum-front", name: "Platinum · Front Row", seatClass: "platinum", priceCents: Math.round(base * 2.8), rows: 2, seatsPerRow: 8 },
  ];
}

/** The composite key stored on a booking: the show (movies only) + tier. */
export function makeTierKey(tierKey: string, showKey?: string): string {
  return showKey ? `${showKey}::${tierKey}` : tierKey;
}

/** Row letters A, B, C, … for a seat grid. */
export function rowLabel(rowIndex: number): string {
  return String.fromCharCode(65 + rowIndex);
}
