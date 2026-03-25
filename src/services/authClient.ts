import { supabase } from "@/lib/supabase";

export async function getAccessToken(): Promise<string | null> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) {
      console.warn("Supabase getSession error:", error.message);
      return null;
    }
    return session?.access_token ?? null;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (
      typeof msg === "string" &&
      (msg.includes("x-api-key") || msg.includes("authentication_error"))
    ) {
      console.error(
        "Supabase auth config error. Check NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
      );
    }
    return null;
  }
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

