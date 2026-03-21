import { NextRequest, NextResponse } from "next/server";

/** Briefings are not sent by email for now; they are only shown as cards on the briefings page. */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ sent: 0, total: 0 });
}
