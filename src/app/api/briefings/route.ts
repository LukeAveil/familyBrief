import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";
import { getBriefingsForUser } from "@/services/briefingService";

export async function GET(req: NextRequest) {
  const userId = await getAuthedUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const briefings = await getBriefingsForUser(userId);
    return NextResponse.json(briefings);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to load briefings" },
      { status: 500 }
    );
  }
}
