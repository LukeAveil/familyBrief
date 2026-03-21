import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/** Reads `Authorization: Bearer <jwt>` and validates it with Supabase; returns the signed-in user id or null. */
export async function getAuthedUserIdFromRequest(
  req: NextRequest
): Promise<string | null> {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1];
  if (!token) return null;

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}
