import { NextRequest } from "next/server";
import { getAuthedUserFromRequest } from "@/lib/apiAuth";
import { jsonResponse, parseJsonBody } from "@/lib/api/httpZod";
import {
  errorResponseSchema,
  profileGetResponseSchema,
  profilePostBodySchema,
  userProfileResponseSchema,
} from "@/lib/api/schemas";
import {
  runGetUserProfile,
  runUpsertUserProfile,
} from "@/application/user/userModule";

export async function GET(req: NextRequest) {
  const user = await getAuthedUserFromRequest(req);
  if (!user) {
    return jsonResponse(
      { error: "Unauthorized" },
      errorResponseSchema,
      { status: 401 }
    );
  }

  try {
    const profile = await runGetUserProfile(user.id);
    return jsonResponse(profile, profileGetResponseSchema);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load profile";
    return jsonResponse({ error: message }, errorResponseSchema, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthedUserFromRequest(req);
  if (!user) {
    return jsonResponse(
      { error: "Unauthorized" },
      errorResponseSchema,
      { status: 401 }
    );
  }

  const parsed = await parseJsonBody(req, profilePostBodySchema);
  if (!parsed.ok) return parsed.response;

  const body = parsed.data;

  try {
    const profile = await runUpsertUserProfile(user.id, {
      name: body.name,
      familyName: body.familyName,
      email: user.email ?? "",
    });
    return jsonResponse(profile, userProfileResponseSchema);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to save profile";
    return jsonResponse({ error: message }, errorResponseSchema, { status: 500 });
  }
}
