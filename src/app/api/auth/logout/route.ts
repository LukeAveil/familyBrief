import { jsonResponse } from "@/lib/api/httpZod";
import { logoutResponseSchema } from "@/lib/api/schemas";
import { signOut } from "@/lib/auth";

export async function POST() {
  const result = await signOut();

  if (result.error) {
    return jsonResponse(
      { success: false, error: result.error },
      logoutResponseSchema,
      { status: 500 }
    );
  }

  return jsonResponse({ success: true }, logoutResponseSchema);
}
