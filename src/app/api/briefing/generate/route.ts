import { NextRequest } from "next/server";
import { runGenerateBriefingForUserWeek } from "@/application/briefing/briefingModule";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";
import { jsonResponse } from "@/lib/api/httpZod";
import {
  briefingGenerateResponseSchema,
  errorResponseSchema,
} from "@/lib/api/schemas";

export async function POST(_req: NextRequest) {
  const userId = await getAuthedUserIdFromRequest(_req);
  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, errorResponseSchema, {
      status: 401,
    });
  }

  try {
    const result = await runGenerateBriefingForUserWeek(userId);
    const payload = {
      success: true as const,
      briefing: {
        id: result.briefing.id,
        content: result.briefing.content,
        weekStart: result.briefing.weekStart,
        sentAt: result.briefing.sentAt,
      },
      emailSent: result.emailSent,
    };
    return jsonResponse(
      JSON.parse(JSON.stringify(payload)),
      briefingGenerateResponseSchema
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate briefing";
    return jsonResponse({ error: message }, errorResponseSchema, { status: 500 });
  }
}
