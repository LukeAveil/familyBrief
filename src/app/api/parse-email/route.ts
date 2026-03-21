import { NextRequest } from "next/server";
import { parseEmailToEvents } from "@/lib/anthropic";
import { jsonResponse, parseJsonBody } from "@/lib/api/httpZod";
import {
  errorResponseSchema,
  parseEmailPostBodySchema,
  parseEmailSuccessResponseSchema,
} from "@/lib/api/schemas";
import { buildInsertRowsFromExtracted } from "@/domain/calendarImport";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { syncBriefingsForDates } from "@/services/briefingService";

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
  const { data: members } = await supabaseAdmin
    .from("family_members")
    .select("id, name")
    .eq("user_id", userId);

  const extractedEvents = await parseEmailToEvents(
    payload.subject,
    payload.text ?? payload.html ?? "",
    members || []
  );

  const { data: savedEmail } = await supabaseAdmin
    .from("parsed_emails")
    .insert({
      user_id: userId,
      from_address: payload.from,
      subject: payload.subject,
      body: payload.text,
      processed: true,
    })
    .select()
    .single();

  const rows = buildInsertRowsFromExtracted(
    extractedEvents,
    userId,
    members || [],
    {
      source: "email",
      raw_email_id: savedEmail?.id ?? null,
    }
  );

  if (rows.length > 0) {
    await supabaseAdmin.from("events").insert(rows);
    await syncBriefingsForDates(
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
}
