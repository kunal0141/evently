import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions";

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-neutral-200">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-neutral-900">
          Evently
        </Link>

        <div className="flex items-center gap-5 text-sm">
          {user ? (
            <>
              <Link href="/events" className="text-neutral-600 hover:text-neutral-900">
                Browse
              </Link>
              <Link href="/my-events" className="text-neutral-600 hover:text-neutral-900">
                My events
              </Link>
              <Link href="/bookings" className="text-neutral-600 hover:text-neutral-900">
                My bookings
              </Link>
              <Link
                href="/events/new"
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-white hover:bg-neutral-700"
              >
                + New event
              </Link>
              <span className="hidden text-neutral-400 sm:inline">
                {user.user_metadata?.full_name || user.email}
              </span>
              <form action={logout}>
                <button className="text-neutral-600 hover:text-neutral-900" type="submit">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-neutral-600 hover:text-neutral-900">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-neutral-900 px-3 py-1.5 text-white hover:bg-neutral-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
