"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getShowsForMovie,
  getTiersForEvent,
  makeTierKey,
  rowLabel,
  CLASS_LABEL,
  type Show,
  type Tier,
} from "@/lib/tiers";
import { formatPrice } from "@/lib/categories";
import { bookSeats } from "@/app/events/[id]/book/actions";
import type { Event } from "@/types";

const MAX_SEATS = 8;

const classDotClass: Record<string, string> = {
  silver: "bg-neutral-400",
  gold: "bg-amber-400",
  platinum: "bg-fuchsia-400",
};

export default function BookingFlow({
  event,
  takenSeats,
  walletBalanceCents,
}: {
  event: Event;
  /** composite tier key ("showKey::tierKey" or just "tierKey") -> taken seat labels */
  takenSeats: Record<string, string[]>;
  walletBalanceCents: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const shows = useMemo(
    () => (event.category === "movies" ? getShowsForMovie(event) : []),
    [event]
  );
  const [showKey, setShowKey] = useState<string | undefined>(shows[0]?.key);
  const currentShow = shows.find((s) => s.key === showKey);

  const tiers = useMemo(
    () => getTiersForEvent(event, showKey),
    [event, showKey]
  );
  const [tierKey, setTierKey] = useState<string>(tiers[0]?.key ?? "");
  const currentTier: Tier = tiers.find((t) => t.key === tierKey) ?? tiers[0];

  const compositeKey = makeTierKey(currentTier.key, showKey);
  const taken = useMemo(
    () => new Set(takenSeats[compositeKey] ?? []),
    [takenSeats, compositeKey]
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());

  function switchTier(key: string) {
    setTierKey(key);
    setSelected(new Set());
    setError(null);
  }

  function switchShow(show: Show) {
    setShowKey(show.key);
    setSelected(new Set());
    setError(null);
  }

  function toggleSeat(label: string) {
    if (taken.has(label)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        if (next.size >= MAX_SEATS) return prev;
        next.add(label);
      }
      return next;
    });
    setError(null);
  }

  const total = selected.size * currentTier.priceCents;
  const insufficientFunds = total > walletBalanceCents;

  function confirm() {
    if (selected.size === 0) return;
    setError(null);
    startTransition(async () => {
      const result = await bookSeats(
        event.id,
        compositeKey,
        currentTier.seatClass,
        Array.from(selected),
        currentTier.priceCents
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const qs = result.bookingIds.map((id) => `b=${id}`).join("&");
      router.push(`/bookings?purchased=1&${qs}`);
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl tracking-wide text-text">{event.title}</h1>
      <p className="mt-1 text-sm text-text-muted">
        {event.category === "movies" ? "Choose a showtime, then your seats." : "Choose a section, then your seats."}
      </p>

      {/* Movies: theatre / format / time picker */}
      {event.category === "movies" && (
        <div className="mt-6 space-y-4">
          {["PVR Cinemas", "INOX Movies"].map((theatreName) => {
            const theatreShows = shows.filter((s) => s.theatre === theatreName);
            if (!theatreShows.length) return null;
            return (
              <div key={theatreName}>
                <p className="mb-2 text-sm font-medium text-text">{theatreName}</p>
                <div className="flex flex-wrap gap-2">
                  {theatreShows.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => switchShow(s)}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        s.key === showKey
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text"
                      }`}
                    >
                      {s.format} · {s.time}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {currentShow && (
            <p className="text-xs text-text-faint">
              Showing seats for{" "}
              <span className="font-medium text-text-muted">
                {currentShow.theatre} · {currentShow.format} · {currentShow.time}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Tier / stand / section picker */}
      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-text">
          {event.category === "sports" ? "Choose your stand" : "Choose your section"}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {tiers.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => switchTier(t.key)}
              className={`rounded-lg border px-3 py-2.5 text-left transition ${
                t.key === tierKey
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-surface hover:border-border-strong"
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
                <span className={`h-2 w-2 rounded-full ${classDotClass[t.seatClass]}`} />
                {CLASS_LABEL[t.seatClass]}
              </span>
              <p className="mt-0.5 truncate text-sm font-semibold text-text">{t.name}</p>
              <p className="text-xs text-text-muted">{formatPrice(t.priceCents)} / seat</p>
            </button>
          ))}
        </div>
      </div>

      {/* Seat map */}
      <div className="mt-6 rounded-2xl border border-border bg-surface p-4 sm:p-6">
        <div className="mb-6 flex justify-center">
          <div className="h-1.5 w-2/3 rounded-full bg-gradient-to-r from-transparent via-border-strong to-transparent" />
        </div>
        <p className="-mt-4 mb-6 text-center text-[11px] uppercase tracking-widest text-text-faint">
          {event.category === "movies"
            ? "Screen this side"
            : event.category === "sports"
              ? "Field this side"
              : "Stage this side"}
        </p>

        <div className="scroll-row overflow-x-auto pb-2">
          <div className="mx-auto flex w-fit flex-col gap-1.5">
            {Array.from({ length: currentTier.rows }).map((_, r) => (
              <div key={r} className="flex items-center gap-1.5">
                <span className="w-4 shrink-0 text-center text-[10px] text-text-faint">
                  {rowLabel(r)}
                </span>
                {Array.from({ length: currentTier.seatsPerRow }).map((_, c) => {
                  const label = `${rowLabel(r)}${c + 1}`;
                  const isTaken = taken.has(label);
                  const isSelected = selected.has(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      disabled={isTaken}
                      onClick={() => toggleSeat(label)}
                      title={label}
                      className={`h-6 w-6 shrink-0 rounded-[5px] text-[9px] font-medium transition ${
                        isTaken
                          ? "cursor-not-allowed bg-bg-elevated text-text-faint/40"
                          : isSelected
                            ? "scale-110 bg-primary text-white shadow-md shadow-primary/40"
                            : "bg-border text-text-muted hover:bg-border-strong hover:text-text"
                      }`}
                    >
                      {c + 1}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] bg-border" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] bg-primary" /> Selected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-[3px] bg-bg-elevated" /> Taken
          </span>
        </div>
      </div>

      {/* Summary + confirm */}
      <div className="sticky bottom-4 mt-6 rounded-2xl border border-border bg-bg-elevated p-4 shadow-2xl shadow-black/50 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-text-muted">
              {selected.size > 0
                ? `${selected.size} seat${selected.size > 1 ? "s" : ""}: ${Array.from(selected).sort().join(", ")}`
                : "No seats selected yet"}
            </p>
            <p className="text-lg font-semibold text-text">{formatPrice(total)}</p>
            <p className="text-xs text-text-faint">
              Wallet balance: {formatPrice(walletBalanceCents)}
            </p>
          </div>
          <button
            type="button"
            onClick={confirm}
            disabled={selected.size === 0 || isPending || insufficientFunds}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? "Booking…" : insufficientFunds ? "Insufficient balance" : "Confirm & pay"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}
