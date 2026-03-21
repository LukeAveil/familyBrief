import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";
import {
  createFamilyMemberForUser,
  getFamilyMembersForUser,
} from "@/services/familyService";

export async function GET(req: NextRequest) {
  const userId = await getAuthedUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const members = await getFamilyMembersForUser(userId);
    return NextResponse.json(members);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to load family members" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const userId = await getAuthedUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();

  try {
    const member = await createFamilyMemberForUser(userId, {
      name: body.name,
      role: body.role,
      age: body.age,
      color: body.color,
    });
    return NextResponse.json(member);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to add family member" },
      { status: 500 }
    );
  }
}

