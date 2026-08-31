import Link from "next/link";
import Logo from "@/components/Logo";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const { error, message, next } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center px-4">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <h1 className="mb-1 font-display text-2xl tracking-wide text-text">Log in</h1>
      <p className="mb-6 text-sm text-text-muted">Welcome back to Evently.</p>

      {message && (
        <p className="mb-4 rounded-lg border border-primary/30 bg-primary-soft px-3.5 py-2.5 text-sm text-text">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <form action={login} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next || "/events"} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-muted" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-muted" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
        </div>
        <button
          type="submit"
          className="mt-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover"
        >
          Log in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        No account?{" "}
        <Link href="/signup" className="font-medium text-primary-hover hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
