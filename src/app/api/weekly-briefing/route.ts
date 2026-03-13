import { NextRequest, NextResponse } from "next/server";
import { sendWeeklyBriefingsForActiveUsers } from "@/services/briefingService";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sent, total } = await sendWeeklyBriefingsForActiveUsers();
  return NextResponse.json({ sent, total });
}
