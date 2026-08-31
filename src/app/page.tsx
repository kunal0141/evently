import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/events");
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-neutral-900">
        Find events. Book a spot. Host your own.
      </h1>
      <p className="mt-4 max-w-lg text-neutral-500">
        Evently is a tiny events platform: create an event, share it, and let
        people reserve one of a limited number of seats — no back-and-forth
        emails.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/signup"
          className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
