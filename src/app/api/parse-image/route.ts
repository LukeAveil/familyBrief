import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";
import { processParseImageUpload } from "@/services/parseImageService";

/**
 * Multipart upload → Claude vision/PDF extraction → Supabase insert → optional briefing refresh.
 * Delegates domain logic to `processParseImageUpload`.
 */
export async function POST(req: NextRequest) {
  const userId = await getAuthedUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const result = await processParseImageUpload(userId, file);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json({ events: result.events, count: result.count });
}
