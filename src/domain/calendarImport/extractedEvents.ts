import type { Event } from "@/types";

export const EVENT_CATEGORIES = new Set([
  "school",
  "activity",
  "medical",
  "social",
  "other",
]);

export type FamilyMemberPick = { id: string; name: string };

/** Supabase `events` row for inserts from AI extraction (email or image). */
export type CalendarEventInsertRow = {
  user_id: string;
  family_member_id: string | null;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  location: string | null;
  category: Event["category"];
  source: "email" | "image";
  raw_email_id: string | null;
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Returns YYYY-MM-DD or null if the value is not a valid ISO calendar date string. */
export function coerceIsoDate(value: unknown): string | null {
  if (typeof value !== "string" || !ISO_DATE_RE.test(value)) return null;
  return value;
}

function normalizeNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim();
}

export function normalizeCategory(value: unknown): Event["category"] {
  if (typeof value === "string" && EVENT_CATEGORIES.has(value)) {
    return value as Event["category"];
  }
  return "other";
}

function resolveFamilyMemberId(
  familyMemberName: unknown,
  members: FamilyMemberPick[]
): string | null {
  if (typeof familyMemberName !== "string") return null;
  return members.find((m) => m.name === familyMemberName)?.id ?? null;
}

export type ExtractedEventImportMeta = {
  source: "email" | "image";
  raw_email_id: string | null;
};

/**
 * Maps one Claude JSON object to a calendar insert row.
 * Rows without a valid `date` are skipped (returns null).
 */
export function mapExtractedItemToInsertRow(
  raw: unknown,
  userId: string,
  members: FamilyMemberPick[],
  meta: ExtractedEventImportMeta
): CalendarEventInsertRow | null {
  const e = raw as Record<string, unknown>;
  const date = coerceIsoDate(e.date);
  if (!date) return null;

  const title =
    typeof e.title === "string" && e.title.trim()
      ? e.title.trim()
      : "Untitled";

  return {
    user_id: userId,
    family_member_id: resolveFamilyMemberId(e.familyMemberName, members),
    title,
    description: normalizeNullableString(e.description),
    date,
    time: normalizeNullableString(e.time),
    location: normalizeNullableString(e.location),
    category: normalizeCategory(e.category),
    source: meta.source,
    raw_email_id: meta.raw_email_id,
  };
}

export function buildInsertRowsFromExtracted(
  extracted: unknown[],
  userId: string,
  members: FamilyMemberPick[],
  meta: ExtractedEventImportMeta
): CalendarEventInsertRow[] {
  return extracted
    .map((item) => mapExtractedItemToInsertRow(item, userId, members, meta))
    .filter((row): row is CalendarEventInsertRow => row !== null);
}
