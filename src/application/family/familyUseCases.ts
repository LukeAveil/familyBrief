import type {
  CreateFamilyMemberInput,
  FamilyRepository,
} from "@/application/family/familyPorts";
import type { FamilyMember } from "@/types";

export async function getFamilyMembersForUser(
  userId: string,
  repo: FamilyRepository
): Promise<FamilyMember[]> {
  return repo.listForUser(userId);
}

export async function createFamilyMemberForUser(
  userId: string,
  input: CreateFamilyMemberInput,
  repo: FamilyRepository
): Promise<FamilyMember> {
  return repo.createForUser(userId, input);
}
