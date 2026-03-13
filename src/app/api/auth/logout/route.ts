import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";

export async function POST() {
  const result = await signOut();

  if (result.error) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

