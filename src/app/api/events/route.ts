import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";
import {
  runCreateManualEventForUser,
  runDeleteEventForUser,
  runGetEventForUser,
  runGetEventsForUser,
} from "@/application/events/eventModule";
import { syncBriefingsForDates } from "@/services/briefingService";

export async function GET(req: NextRequest) {
  const userId = await getAuthedUserIdFromRequest(req);
  // Keep response shape stable for the client hook; unauthenticated users have no events.
  if (!userId) return NextResponse.json([], { status: 401 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  try {
    const events = await runGetEventsForUser(userId, { start, end });
    return NextResponse.json(events);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to load events" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const userId = await getAuthedUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  try {
    const event = await runCreateManualEventForUser(userId, {
      title: body.title,
      date: body.date,
      time: body.time,
      location: body.location,
      category: body.category,
      familyMemberId: body.family_member_id ?? null,
      description: body.description,
    });
    try {
      await syncBriefingsForDates(userId, [body.date]);
    } catch (briefingError: any) {
      console.warn("Briefing update failed (event was created):", briefingError?.message);
    }
    return NextResponse.json(event);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create event" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await getAuthedUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const event = await runGetEventForUser(userId, id);
    await runDeleteEventForUser(userId, id);
    if (event?.date) {
      try {
        await syncBriefingsForDates(userId, [event.date]);
      } catch (briefingError: any) {
        console.warn("Briefing update after delete failed:", briefingError?.message);
      }
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to delete event" },
      { status: 500 }
    );
  }
}
