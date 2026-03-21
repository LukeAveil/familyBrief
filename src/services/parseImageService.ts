import { parseImageOrPdfToEvents } from "@/lib/anthropic";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  buildInsertRowsFromExtracted,
  fileToBase64,
  resolveMediaTypeForVision,
  validateUploadedFile,
  type FamilyMemberPick,
  type CalendarEventInsertRow,
} from "@/domain/calendarImport";
import {
  mapEventRow,
  type EventRow,
} from "@/infrastructure/events/supabaseEventRepository";
import { syncBriefingsForDates } from "@/services/briefingService";
import type { Event } from "@/types";

export type { FamilyMemberPick } from "@/domain/calendarImport";
export {
  MAX_PARSE_IMAGE_BYTES,
  buildInsertRowsFromExtracted,
  coerceIsoDate,
  fileToBase64,
  mapExtractedItemToInsertRow,
  resolveMediaTypeForVision,
  validateUploadedFile,
} from "@/domain/calendarImport";

export type ParseImageResult =
  | { ok: true; events: Event[]; count: number }
  | {
      ok: false;
      status: number;
      message: string;
      log?: string;
    };

export async function loadFamilyMembers(
  userId: string
): Promise<{ ok: true; members: FamilyMemberPick[] } | { ok: false; message: string }> {
  const { data, error } = await supabaseAdmin
    .from("family_members")
    .select("id, name")
    .eq("user_id", userId);

  if (error) {
    console.error("parse-image family_members:", error.message);
    return { ok: false, message: "Failed to load family members" };
  }

  return { ok: true, members: data ?? [] };
}

export async function insertCalendarImportEvents(
  rows: CalendarEventInsertRow[]
): Promise<{ ok: true; events: Event[] } | { ok: false; message: string }> {
  const { data: inserted, error } = await supabaseAdmin
    .from("events")
    .insert(rows)
    .select("*, family_members(id, name, color)");

  if (error) {
    console.error("parse-image insert:", error.message);
    return { ok: false, message: "Failed to save events" };
  }

  const list = (inserted ?? []) as EventRow[];
  return { ok: true, events: list.map(mapEventRow) };
}

/** @deprecated use insertCalendarImportEvents */
export const insertImageEvents = insertCalendarImportEvents;

/**
 * End-to-end: validate file, resolve MIME, call Claude, insert rows, refresh briefings.
 */
export async function processParseImageUpload(
  userId: string,
  file: File
): Promise<ParseImageResult> {
  const validation = validateUploadedFile(file);
  if (!validation.ok) {
    return { ok: false, status: 400, message: validation.error };
  }

  const mediaType = resolveMediaTypeForVision(validation.file);
  if (!mediaType) {
    return {
      ok: false,
      status: 400,
      message:
        "Unsupported file type. Use PDF or a common image (JPEG, PNG, GIF, WebP).",
    };
  }

  const membersResult = await loadFamilyMembers(userId);
  if (!membersResult.ok) {
    return { ok: false, status: 500, message: membersResult.message };
  }
  const { members } = membersResult;

  let extracted: unknown[];
  try {
    const base64 = await fileToBase64(validation.file);
    extracted = (await parseImageOrPdfToEvents(
      base64,
      mediaType,
      members
    )) as unknown[];
  } catch (e) {
    const msg = (e as Error)?.message;
    console.error("parse-image Claude:", msg);
    return {
      ok: false,
      status: 500,
      message: "Could not read this file. Try another image or PDF.",
      log: msg,
    };
  }

  if (!Array.isArray(extracted) || extracted.length === 0) {
    return { ok: true, events: [], count: 0 };
  }

  const rows = buildInsertRowsFromExtracted(extracted, userId, members, {
    source: "image",
    raw_email_id: null,
  });
  if (rows.length === 0) {
    return { ok: true, events: [], count: 0 };
  }

  const inserted = await insertCalendarImportEvents(rows);
  if (!inserted.ok) {
    return { ok: false, status: 500, message: inserted.message };
  }

  await syncBriefingsForDates(userId, rows.map((r) => r.date));

  return {
    ok: true,
    events: inserted.events,
    count: inserted.events.length,
  };
}
