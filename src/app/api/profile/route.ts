import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  getUserProfile,
  upsertUserProfileForUser,
} from "@/services/userService";

async function getAuthedUser(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1];
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function GET(req: NextRequest) {
  const user = await getAuthedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const profile = await getUserProfile(user.id);
    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();

  try {
    const profile = await upsertUserProfileForUser(user.id, {
      name: body.name,
      familyName: body.familyName,
      email: user.email ?? "",
    });
    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to save profile" },
      { status: 500 }
    );
  }
}

