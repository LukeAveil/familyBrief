import { supabase } from "@/lib/supabase";

type AuthResult<T> = {
  data: T | null;
  error: string | null;
};

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<AuthResult<{ userId: string }>> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  const userId = data.user?.id;
  // In some Supabase configs, signups can succeed without an immediate user object
  // (e.g. email confirmation flows). Treat a successful response as a success here.
  return { data: { userId: userId ?? "" }, error: null };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult<{ userId: string }>> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  const userId = data.user?.id;
  // As with signup, treat any non-error response as a successful sign-in,
  // even if the user object is not immediately populated.
  return { data: { userId: userId ?? "" }, error: null };
}

export async function signOut(): Promise<AuthResult<null>> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

export async function getCurrentUserId(): Promise<AuthResult<string>> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { data: null, error: error.message };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { data: null, error: "Not signed in." };
  }

  return { data: userId, error: null };
}

