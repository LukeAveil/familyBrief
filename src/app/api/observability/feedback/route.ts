import { NextRequest, NextResponse } from "next/server";
import {
  BriefingNotFoundError,
  recordBriefingFeedback,
} from "@/application/briefing/briefingUseCases";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";
import { supabaseBriefingRepository } from "@/infrastructure/briefing/supabaseBriefingRepository";

export async function POST(req: NextRequest) {
  const userId = await getAuthedUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { briefingId?: string; sentiment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const briefingId = body.briefingId;
  const sentiment = body.sentiment;
  if (!briefingId || typeof briefingId !== "string") {
    return NextResponse.json({ error: "briefingId is required" }, { status: 400 });
  }
  if (sentiment !== "up" && sentiment !== "down") {
    return NextResponse.json(
      { error: "sentiment must be 'up' or 'down'" },
      { status: 400 }
    );
  }

  try {
    await recordBriefingFeedback(userId, briefingId, sentiment, {
      repo: supabaseBriefingRepository,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof BriefingNotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const message =
      e instanceof Error ? e.message : "Failed to record feedback";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
