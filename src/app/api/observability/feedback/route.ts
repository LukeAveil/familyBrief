import { NextRequest } from "next/server";
import { BriefingNotFoundError } from "@/application/briefing/briefingUseCases";
import { runRecordBriefingFeedback } from "@/application/briefing/briefingModule";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";
import { jsonResponse, parseJsonBody } from "@/lib/api/httpZod";
import {
  errorResponseSchema,
  feedbackOkResponseSchema,
  feedbackPostBodySchema,
} from "@/lib/api/schemas";

export async function POST(req: NextRequest) {
  const userId = await getAuthedUserIdFromRequest(req);
  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, errorResponseSchema, {
      status: 401,
    });
  }

  const parsed = await parseJsonBody(req, feedbackPostBodySchema);
  if (!parsed.ok) return parsed.response;

  const { briefingId, sentiment } = parsed.data;

  try {
    await runRecordBriefingFeedback(userId, briefingId, sentiment);
    return jsonResponse({ ok: true }, feedbackOkResponseSchema);
  } catch (e) {
    if (e instanceof BriefingNotFoundError) {
      return jsonResponse({ error: "Not found" }, errorResponseSchema, {
        status: 404,
      });
    }
    const message =
      e instanceof Error ? e.message : "Failed to record feedback";
    return jsonResponse({ error: message }, errorResponseSchema, { status: 500 });
  }
}
