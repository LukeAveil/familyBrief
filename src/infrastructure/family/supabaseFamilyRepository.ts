import type {
  FamilyRepository,
} from "@/application/family/familyPorts";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { FamilyMember } from "@/types";

type FamilyMemberRow = {
  id: string;
  user_id: string;
  name: string;
  role: "parent" | "child";
  age: number | null;
  color: string;
};

function mapFamilyMemberRow(row: FamilyMemberRow): FamilyMember {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    role: row.role,
    age: row.age ?? undefined,
    color: row.color,
  };
}

export const supabaseFamilyRepository: FamilyRepository = {
  async listForUser(userId) {
    const { data, error } = await supabaseAdmin
      .from("family_members")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return (data as FamilyMemberRow[] | null)?.map(mapFamilyMemberRow) ?? [];
  },

  async createForUser(userId, input) {
    const { data, error } = await supabaseAdmin
      .from("family_members")
      .insert({
        user_id: userId,
        name: input.name,
        role: input.role,
        age: typeof input.age === "number" ? input.age : null,
        color: input.color,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapFamilyMemberRow(data as FamilyMemberRow);
  },
};
