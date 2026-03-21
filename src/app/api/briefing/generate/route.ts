import { NextRequest, NextResponse } from "next/server";
import { runGenerateBriefingForUserWeek } from "@/application/briefing/briefingModule";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
  const userId = await getAuthedUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runGenerateBriefingForUserWeek(userId);
    return NextResponse.json({
      success: true,
      briefing: {
        id: result.briefing.id,
        content: result.briefing.content,
        weekStart: result.briefing.weekStart,
        sentAt: result.briefing.sentAt,
      },
      emailSent: result.emailSent,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate briefing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
