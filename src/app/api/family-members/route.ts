import { NextRequest } from "next/server";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";
import {
  runCreateFamilyMemberForUser,
  runGetFamilyMembersForUser,
} from "@/application/family/familyModule";
import { jsonResponse, parseJsonBody } from "@/lib/api/httpZod";
import {
  createFamilyMemberPostBodySchema,
  errorResponseSchema,
  familyMemberListResponseSchema,
  familyMemberResponseSchema,
} from "@/lib/api/schemas";

export async function GET(req: NextRequest) {
  const userId = await getAuthedUserIdFromRequest(req);

  if (!userId) {
    return jsonResponse(
      { error: "Not authenticated" },
      errorResponseSchema,
      { status: 401 }
    );
  }

  try {
    const members = await runGetFamilyMembersForUser(userId);
    return jsonResponse(members, familyMemberListResponseSchema);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load family members";
    return jsonResponse({ error: message }, errorResponseSchema, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getAuthedUserIdFromRequest(req);
  if (!userId) {
    return jsonResponse(
      { error: "Not authenticated" },
      errorResponseSchema,
      { status: 401 }
    );
  }

  const parsed = await parseJsonBody(req, createFamilyMemberPostBodySchema);
  if (!parsed.ok) return parsed.response;

  const body = parsed.data;

  try {
    const member = await runCreateFamilyMemberForUser(userId, {
      name: body.name,
      role: body.role,
      age: body.age,
      color: body.color,
    });
    return jsonResponse(member, familyMemberResponseSchema);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to add family member";
    return jsonResponse({ error: message }, errorResponseSchema, { status: 500 });
  }
}
