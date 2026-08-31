import EventForm from "@/components/EventForm";
import { createEvent } from "../actions";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-neutral-900">Create an event</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Fill in the details — people will be able to browse and book it right away.
      </p>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <EventForm action={createEvent} submitLabel="Create event" />
    </div>
  );
}
