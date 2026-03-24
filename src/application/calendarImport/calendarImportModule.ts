import { parseImageOrPdfToEvents } from "@/lib/anthropic";
import { runInsertExtractedEventsForUser } from "@/application/events/eventModule";
import { runGetFamilyMembersForUser } from "@/application/family/familyModule";
import { runSyncBriefingsForDates } from "@/application/briefing/briefingModule";
import {
  buildInsertRowsFromExtracted,
  fileToBase64,
  resolveMediaTypeForVision,
  validateUploadedFile,
} from "@/domain/calendarImport";
import type { FamilyMemberPick } from "@/domain/calendarImport";
import type { Event } from "@/types";

export type ParseImageResult =
  | { ok: true; events: Event[]; count: number }
  | { ok: false; status: number; message: string; log?: string };

export async function runProcessParseImageUpload(
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

  let members: FamilyMemberPick[];
  try {
    const raw = await runGetFamilyMembersForUser(userId);
    members = raw.map((m) => ({ id: m.id, name: m.name }));
  } catch (e) {
    console.error(
      "parse-image family_members:",
      e instanceof Error ? e.message : e
    );
    return { ok: false, status: 500, message: "Failed to load family members" };
  }

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

  let events: Event[];
  try {
    events = await runInsertExtractedEventsForUser(userId, rows);
  } catch (e) {
    console.error(
      "parse-image insert:",
      e instanceof Error ? e.message : e
    );
    return { ok: false, status: 500, message: "Failed to save events" };
  }

  await runSyncBriefingsForDates(userId, rows.map((r) => r.date));

  return { ok: true, events, count: events.length };
}
