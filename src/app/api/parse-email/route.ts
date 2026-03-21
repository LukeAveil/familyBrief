import { NextRequest, NextResponse } from "next/server";
import { parseEmailToEvents } from "@/lib/anthropic";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildInsertRowsFromExtracted } from "@/domain/calendarImport";
import { syncBriefingsForDates } from "@/services/briefingService";

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const toAddress: string = payload.to || "";
  const userIdMatch = toAddress.match(/family\+([^@]+)@/);
  if (!userIdMatch) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const userId = userIdMatch[1];
  const { data: members } = await supabaseAdmin
    .from("family_members")
    .select("id, name")
    .eq("user_id", userId);

  const extractedEvents = await parseEmailToEvents(
    payload.subject,
    payload.text || payload.html,
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

  return NextResponse.json({
    success: true,
    eventsCreated: rows.length,
  });
}
