import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  createManualEventForUser,
  deleteEventForUser,
  getEventsForUser,
} from "@/services/eventService";

async function getAuthedUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1];
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function GET(req: NextRequest) {
  const userId = await getAuthedUserId(req);
  // Keep response shape stable for the client hook; unauthenticated users have no events.
  if (!userId) return NextResponse.json([], { status: 401 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  try {
    const events = await getEventsForUser(userId, { start, end });
    return NextResponse.json(events);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to load events" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const userId = await getAuthedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  try {
    const event = await createManualEventForUser(userId, {
      title: body.title,
      date: body.date,
      time: body.time,
      location: body.location,
      category: body.category,
      familyMemberId: body.family_member_id ?? null,
      description: body.description,
    });
    return NextResponse.json(event);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create event" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await getAuthedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    await deleteEventForUser(userId, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to delete event" },
      { status: 500 }
    );
  }
}
