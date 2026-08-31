import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout, topUpWallet } from "@/app/actions";
import { formatPrice } from "@/lib/categories";
import Logo from "./Logo";

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let walletBalanceCents: number | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_balance_cents")
      .eq("user_id", user.id)
      .single();
    walletBalanceCents = profile?.wallet_balance_cents ?? 0;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/70">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <div className="flex items-center gap-1 text-sm sm:gap-2">
          {user ? (
            <>
              <Link
                href="/events"
                className="hidden rounded-full px-3 py-1.5 text-text-muted transition hover:bg-surface hover:text-text sm:inline-block"
              >
                Browse
              </Link>
              <Link
                href="/my-events"
                className="hidden rounded-full px-3 py-1.5 text-text-muted transition hover:bg-surface hover:text-text sm:inline-block"
              >
                My events
              </Link>
              <Link
                href="/bookings"
                className="hidden rounded-full px-3 py-1.5 text-text-muted transition hover:bg-surface hover:text-text sm:inline-block"
              >
                My bookings
              </Link>
              <Link
                href="/events/new"
                className="ml-1 rounded-full bg-primary px-3.5 py-1.5 font-medium text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition hover:bg-primary-hover sm:ml-2"
              >
                + Host event
              </Link>
              <span className="mx-1 hidden h-5 w-px bg-border md:inline-block" />
              {walletBalanceCents !== null && (
                <div className="flex items-center gap-1 rounded-full border border-border bg-surface py-1 pl-3 pr-1 text-xs font-medium text-text">
                  <span title="Wallet balance (test money, no real payments)">
                    💰 {formatPrice(walletBalanceCents)}
                  </span>
                  <form action={topUpWallet}>
                    <button
                      type="submit"
                      title="Add ₹10,000 test credits"
                      className="rounded-full bg-bg-elevated px-2 py-0.5 text-[11px] font-semibold text-text-muted transition hover:bg-primary hover:text-white"
                    >
                      + Top up
                    </button>
                  </form>
                </div>
              )}
              <span className="hidden max-w-[9rem] truncate text-text-faint md:inline">
                {user.user_metadata?.full_name || user.email}
              </span>
              <form action={logout}>
                <button
                  className="rounded-full px-3 py-1.5 text-text-muted transition hover:bg-surface hover:text-text"
                  type="submit"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3.5 py-1.5 text-text-muted transition hover:bg-surface hover:text-text"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-primary px-3.5 py-1.5 font-medium text-white transition hover:bg-primary-hover"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      {user && (
        <div className="flex items-center gap-1 overflow-x-auto border-t border-border/60 px-4 py-1.5 text-sm sm:hidden">
          <Link href="/events" className="whitespace-nowrap rounded-full px-3 py-1 text-text-muted hover:bg-surface hover:text-text">
            Browse
          </Link>
          <Link href="/my-events" className="whitespace-nowrap rounded-full px-3 py-1 text-text-muted hover:bg-surface hover:text-text">
            My events
          </Link>
          <Link href="/bookings" className="whitespace-nowrap rounded-full px-3 py-1 text-text-muted hover:bg-surface hover:text-text">
            My bookings
          </Link>
          {walletBalanceCents !== null && (
            <span className="ml-auto whitespace-nowrap rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text">
              💰 {formatPrice(walletBalanceCents)}
            </span>
          )}
        </div>
      )}
    </header>
  );
}
