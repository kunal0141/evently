import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/categories";
import Backdrop3D from "@/components/Backdrop3D";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/events");
  }

  return (
    <div className="relative isolate overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[52rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(176,20,47,0.55), rgba(176,20,47,0) 70%)",
        }}
      />
      {/* 3D revolving showcase: mic → clapperboard → drama masks → bat & ball → music → art */}
      <Backdrop3D variant="hero" />

      <div className="relative mx-auto flex min-h-[78vh] max-w-3xl flex-col items-center justify-center px-4 pt-16 text-center sm:pt-20">
        <h1 className="font-display text-5xl leading-[1.05] tracking-wide text-text sm:text-7xl">
          <span className="typewriter-text">
            Every event <span className="text-primary-hover">worth going to.</span>
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-balance text-base text-text-muted sm:text-lg">
          Book standup comedy, concerts, workshops, conferences and more, or
          host your own event and sell out in minutes. No back-and-forth
          emails, no spreadsheets.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-hover"
          >
            Get started, it&apos;s free
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-border bg-surface px-7 py-3 text-sm font-semibold text-text transition hover:border-border-strong"
          >
            Log in
          </Link>
        </div>
      </div>

      {/* Category strip */}
      <div className="relative mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-text-faint">
          Explore what&apos;s live right now
        </p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {CATEGORIES.filter((c) => c.id !== "other").map((c) => (
            <Link
              key={c.id}
              href={`/login?next=${encodeURIComponent(`/events?category=${c.id}`)}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface px-3 py-5 transition hover:-translate-y-1 hover:border-border-strong hover:shadow-lg hover:shadow-black/40"
              style={{ backgroundImage: c.gradient, backgroundBlendMode: "soft-light" }}
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="text-center text-xs font-medium text-text">{c.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
