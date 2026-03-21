import type {
  UpsertUserProfileInput,
  UserProfile,
  UserRepository,
} from "@/application/user/userPorts";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  family_name: string | null;
};

function mapUserRow(row: UserRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? "",
    familyName: row.family_name ?? "",
  };
}

export const supabaseUserRepository: UserRepository = {
  async getById(userId) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id,email,name,family_name")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) return null;
    return mapUserRow(data as UserRow);
  },

  async upsert(userId: string, input: UpsertUserProfileInput) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          id: userId,
          email: input.email,
          name: input.name,
          family_name: input.familyName,
        },
        { onConflict: "id" }
      )
      .select("id,email,name,family_name")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapUserRow(data as UserRow);
  },
};
