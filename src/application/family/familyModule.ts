import {
  createFamilyMemberForUser,
  getFamilyMembersForUser,
} from "@/application/family/familyUseCases";
import { supabaseFamilyRepository } from "@/infrastructure/family/supabaseFamilyRepository";
import type { CreateFamilyMemberInput } from "@/application/family/familyPorts";
import type { FamilyMember } from "@/types";

export function runGetFamilyMembersForUser(
  userId: string
): Promise<FamilyMember[]> {
  return getFamilyMembersForUser(userId, supabaseFamilyRepository);
}

export function runCreateFamilyMemberForUser(
  userId: string,
  input: CreateFamilyMemberInput
): Promise<FamilyMember> {
  return createFamilyMemberForUser(
    userId,
    input,
    supabaseFamilyRepository
  );
}
