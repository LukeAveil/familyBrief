import { NextRequest } from "next/server";
import { runInsertExtractedEventsForUser } from "@/application/events/eventModule";
import { runGetFamilyMembersForUser } from "@/application/family/familyModule";
import { runRecordParsedEmail } from "@/application/parsedEmail/parsedEmailModule";
import { parseEmailToEvents } from "@/lib/anthropic";
import { jsonResponse, parseJsonBody } from "@/lib/api/httpZod";
import {
  errorResponseSchema,
  parseEmailPostBodySchema,
  parseEmailSuccessResponseSchema,
} from "@/lib/api/schemas";
import { buildInsertRowsFromExtracted } from "@/domain/calendarImport";
import { runSyncBriefingsForDates } from "@/application/briefing/briefingModule";

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, parseEmailPostBodySchema);
  if (!parsed.ok) return parsed.response;

  const payload = parsed.data;
  const toAddress = payload.to;
  const userIdMatch = toAddress.match(/family\+([^@]+)@/);
  if (!userIdMatch) {
    return jsonResponse({ error: "Invalid address" }, errorResponseSchema, {
      status: 400,
    });
  }

  const userId = userIdMatch[1];

  try {
    const members = await runGetFamilyMembersForUser(userId);
    const memberPicks = members.map((m) => ({ id: m.id, name: m.name }));

    const extractedEvents = await parseEmailToEvents(
      payload.subject,
      payload.text ?? payload.html ?? "",
      memberPicks
    );

    const savedEmail = await runRecordParsedEmail({
      userId,
      fromAddress: payload.from,
      subject: payload.subject,
      body: payload.text,
    });

    const rows = buildInsertRowsFromExtracted(
      extractedEvents,
      userId,
      memberPicks,
      {
        source: "email",
        raw_email_id: savedEmail?.id ?? null,
      }
    );

    if (rows.length > 0) {
      await runInsertExtractedEventsForUser(userId, rows);
      await runSyncBriefingsForDates(
        userId,
        rows.map((r) => r.date)
      );
    }

    return jsonResponse(
      {
        success: true as const,
        eventsCreated: rows.length,
      },
      parseEmailSuccessResponseSchema
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to process email";
    return jsonResponse({ error: message }, errorResponseSchema, {
      status: 500,
    });
  }
}
