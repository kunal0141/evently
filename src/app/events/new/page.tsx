import EventForm from "@/components/EventForm";
import { createEvent } from "../actions";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <h1 className="mb-1 font-display text-3xl tracking-wide text-text">Host an event</h1>
      <p className="mb-6 text-sm text-text-muted">
        Fill in the details — people will be able to browse and book it right away.
      </p>

      {error && (
        <p className="mb-4 rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <EventForm action={createEvent} submitLabel="Publish event" />
    </div>
  );
}
