import Link from "next/link";
import Logo from "@/components/Logo";
import { signup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center px-4">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <h1 className="mb-1 font-display text-2xl tracking-wide text-text">Sign up</h1>
      <p className="mb-6 text-sm text-text-muted">
        Create an account to host and book events.
      </p>

      {error && (
        <p className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <form action={signup} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-muted" htmlFor="fullName">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
        </div>
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
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
          <p className="mt-1.5 text-xs text-text-faint">At least 6 characters.</p>
        </div>
        <button
          type="submit"
          className="mt-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover"
        >
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary-hover hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
