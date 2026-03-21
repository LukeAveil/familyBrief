import { NextRequest } from "next/server";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";
import { jsonResponse } from "@/lib/api/httpZod";
import {
  errorResponseSchema,
  parseImageSuccessResponseSchema,
} from "@/lib/api/schemas";
import { processParseImageUpload } from "@/services/parseImageService";

/**
 * Multipart upload → Claude vision/PDF extraction → Supabase insert → optional briefing refresh.
 * Delegates domain logic to `processParseImageUpload`.
 */
export async function POST(req: NextRequest) {
  const userId = await getAuthedUserIdFromRequest(req);
  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, errorResponseSchema, {
      status: 401,
    });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return jsonResponse({ error: "Invalid form data" }, errorResponseSchema, {
      status: 400,
    });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonResponse({ error: "Missing file" }, errorResponseSchema, {
      status: 400,
    });
  }

  const result = await processParseImageUpload(userId, file);

  if (!result.ok) {
    return jsonResponse({ error: result.message }, errorResponseSchema, {
      status: result.status,
    });
  }

  return jsonResponse(
    { events: result.events, count: result.count },
    parseImageSuccessResponseSchema
  );
}
