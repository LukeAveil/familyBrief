import { parseImageOrPdfToEvents } from "@/lib/anthropic";
import { runInsertExtractedEventsForUser } from "@/application/events/eventModule";
import { runGetFamilyMembersForUser } from "@/application/family/familyModule";
import {
  buildInsertRowsFromExtracted,
  fileToBase64,
  resolveMediaTypeForVision,
  validateUploadedFile,
  type FamilyMemberPick,
  type CalendarEventInsertRow,
} from "@/domain/calendarImport";
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
  try {
    const members = await runGetFamilyMembersForUser(userId);
    return {
      ok: true,
      members: members.map((m) => ({ id: m.id, name: m.name })),
    };
  } catch (e) {
    console.error(
      "parse-image family_members:",
      e instanceof Error ? e.message : e
    );
    return { ok: false, message: "Failed to load family members" };
  }
}

export async function insertCalendarImportEvents(
  userId: string,
  rows: CalendarEventInsertRow[]
): Promise<{ ok: true; events: Event[] } | { ok: false; message: string }> {
  try {
    const events = await runInsertExtractedEventsForUser(userId, rows);
    return { ok: true, events };
  } catch (e) {
    console.error(
      "parse-image insert:",
      e instanceof Error ? e.message : e
    );
    return { ok: false, message: "Failed to save events" };
  }
}

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

  const inserted = await insertCalendarImportEvents(userId, rows);
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
