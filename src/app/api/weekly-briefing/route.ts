import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api/httpZod";
import {
  errorResponseSchema,
  weeklyBriefingCronResponseSchema,
} from "@/lib/api/schemas";
import { runSendWeeklyBriefingsForActiveUsers } from "@/application/briefing/briefingModule";

/** Cron: send weekly briefings to all active subscribers (Bearer CRON_SECRET). */
export async function POST(_req: NextRequest) {
  const authHeader = _req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return jsonResponse({ error: "Unauthorized" }, errorResponseSchema, {
      status: 401,
    });
  }

  const result = await runSendWeeklyBriefingsForActiveUsers();
  return jsonResponse(result, weeklyBriefingCronResponseSchema);
}
