import { NextRequest } from "next/server";
import { runListBriefingItemsForUser } from "@/application/briefing/briefingModule";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";
import { jsonResponse } from "@/lib/api/httpZod";
import {
  briefingListResponseSchema,
  errorResponseSchema,
} from "@/lib/api/schemas";

export async function GET(_req: NextRequest) {
  const userId = await getAuthedUserIdFromRequest(_req);
  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, errorResponseSchema, {
      status: 401,
    });
  }

  try {
    const items = await runListBriefingItemsForUser(userId);
    return jsonResponse(
      JSON.parse(JSON.stringify(items)),
      briefingListResponseSchema
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load briefings";
    return jsonResponse({ error: message }, errorResponseSchema, { status: 500 });
  }
}
