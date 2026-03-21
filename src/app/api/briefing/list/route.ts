import { NextRequest, NextResponse } from "next/server";
import { listBriefingItemsForUser } from "@/application/briefing/briefingUseCases";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";
import { supabaseBriefingRepository } from "@/infrastructure/briefing/supabaseBriefingRepository";

export async function GET(_req: NextRequest) {
  const userId = await getAuthedUserIdFromRequest(_req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await listBriefingItemsForUser(userId, supabaseBriefingRepository);
    return NextResponse.json(items);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load briefings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
