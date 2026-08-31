import type { Event } from "@/types";
import { CATEGORIES } from "@/lib/categories";

function toDatetimeLocal(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-faint outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25";
const labelClass = "mb-1.5 block text-sm font-medium text-text-muted";

export default function EventForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  defaultValues?: Partial<Event>;
  submitLabel: string;
}) {
  const priceRupees =
    defaultValues?.price_cents != null ? defaultValues.price_cents / 100 : 0;

  return (
    <form action={action} className="flex flex-col gap-5">
      <div>
        <label className={labelClass} htmlFor="title">
          Event title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={120}
          placeholder="e.g. Zakir Khan Live — Haq Se Single"
          defaultValue={defaultValues?.title}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="category">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={defaultValues?.category ?? "other"}
          className={inputClass}
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="What's this event about? What should attendees expect?"
          defaultValue={defaultValues?.description}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="location">
          Venue / location
        </label>
        <input
          id="location"
          name="location"
          type="text"
          placeholder="e.g. Online, or Phoenix Marketcity, Bengaluru"
          defaultValue={defaultValues?.location}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="event_time">
            Date &amp; time
          </label>
          <input
            id="event_time"
            name="event_time"
            type="datetime-local"
            required
            defaultValue={toDatetimeLocal(defaultValues?.event_time)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="capacity">
            Capacity
          </label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            required
            defaultValue={defaultValues?.capacity ?? 50}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="price">
            Price (₹)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step="1"
            placeholder="0 for free"
            defaultValue={priceRupees || ""}
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover active:scale-[0.99]"
      >
        {submitLabel}
      </button>
    </form>
  );
}
