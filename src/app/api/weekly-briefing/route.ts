import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api/httpZod";
import {
  errorResponseSchema,
  weeklyBriefingCronResponseSchema,
} from "@/lib/api/schemas";

/** Briefings are not sent by email for now; they are only shown as cards on the briefings page. */
export async function POST(_req: NextRequest) {
  const authHeader = _req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return jsonResponse({ error: "Unauthorized" }, errorResponseSchema, {
      status: 401,
    });
  }
  return jsonResponse({ sent: 0, total: 0 }, weeklyBriefingCronResponseSchema);
}
