/** Valid event categories (invariant: category must be one of these) */
export const EVENT_CATEGORIES = [
  "school",
  "activity",
  "medical",
  "social",
  "other",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_SOURCES = ["manual", "email", "image"] as const;

export type EventSource = (typeof EVENT_SOURCES)[number];

export interface Event {
  id: string;
  userId: string;
  familyMemberId: string | null;
  familyMember?: {
    id: string;
    name: string;
    color: string;
  };
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string;
  location?: string;
  category: EventCategory;
  source: EventSource;
  rawEmailId?: string;
  createdAt: string; // ISO timestamp
}

/** YYYY-MM-DD date string; use parseEventDate to validate. */
export type EventDate = string;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parses and validates an event date string (YYYY-MM-DD).
 * Returns the string if valid, otherwise throws.
 */
export function parseEventDate(value: unknown): EventDate {
  if (typeof value !== "string" || !DATE_REGEX.test(value)) {
    throw new Error("Event date must be YYYY-MM-DD");
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid event date");
  }
  return value;
}

export function isEventCategory(value: string): value is EventCategory {
  return (EVENT_CATEGORIES as readonly EventCategory[]).includes(
    value as EventCategory
  );
}

/**
 * Validates category; returns it if valid, otherwise throws.
 */
export function parseEventCategory(value: unknown): EventCategory {
  if (typeof value !== "string" || !isEventCategory(value)) {
    throw new Error(
      `Event category must be one of: ${EVENT_CATEGORIES.join(", ")}`
    );
  }
  return value;
}

/**
 * Validates event-like input for create/update: title required, date and category valid.
 * Returns a sanitized partial event; does not create IDs or timestamps.
 */
export function validateEventInput(input: {
  title?: unknown;
  date?: unknown;
  category?: unknown;
  time?: unknown;
  location?: unknown;
  description?: unknown;
  familyMemberId?: unknown;
}): {
  title: string;
  date: EventDate;
  category: EventCategory;
  time?: string;
  location?: string;
  description?: string;
  familyMemberId: string | null;
} {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) {
    throw new Error("Event title is required");
  }
  return {
    title,
    date: parseEventDate(input.date ?? new Date().toISOString().split("T")[0]),
    category: parseEventCategory(input.category ?? "other"),
    time:
      typeof input.time === "string" ? input.time.trim() || undefined : undefined,
    location:
      typeof input.location === "string"
        ? input.location.trim() || undefined
        : undefined,
    description:
      typeof input.description === "string"
        ? input.description.trim() || undefined
        : undefined,
    familyMemberId:
      typeof input.familyMemberId === "string" && input.familyMemberId.length > 0
        ? input.familyMemberId
        : null,
  };
}
