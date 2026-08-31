import { notFound, redirect } from "next/navigation";
import EventForm from "@/components/EventForm";
import { createClient } from "@/lib/supabase/server";
import { updateEvent } from "../../actions";

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: event } = await supabase.from("events").select("*").eq("id", id).single();
  if (!event) notFound();
  if (event.host_id !== user?.id) redirect(`/events/${id}`);

  const updateEventWithId = async (formData: FormData) => {
    "use server";
    await updateEvent(id, formData);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-neutral-900">Edit event</h1>
      <p className="mb-6 text-sm text-neutral-500">Update the details for {event.title}.</p>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <EventForm action={updateEventWithId} defaultValues={event} submitLabel="Save changes" />
    </div>
  );
}
