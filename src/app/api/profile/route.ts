import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { jsonResponse, parseJsonBody } from "@/lib/api/httpZod";
import {
  errorResponseSchema,
  profileGetResponseSchema,
  profilePostBodySchema,
  userProfileResponseSchema,
} from "@/lib/api/schemas";
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
    return jsonResponse(
      { error: "Not authenticated" },
      errorResponseSchema,
      { status: 401 }
    );
  }

  try {
    const profile = await getUserProfile(user.id);
    return jsonResponse(profile, profileGetResponseSchema);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load profile";
    return jsonResponse({ error: message }, errorResponseSchema, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthedUser(req);
  if (!user) {
    return jsonResponse(
      { error: "Not authenticated" },
      errorResponseSchema,
      { status: 401 }
    );
  }

  const parsed = await parseJsonBody(req, profilePostBodySchema);
  if (!parsed.ok) return parsed.response;

  const body = parsed.data;

  try {
    const profile = await upsertUserProfileForUser(user.id, {
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
