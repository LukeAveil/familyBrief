import type { FamilyMember } from "@/types";

export type CreateFamilyMemberInput = {
  name: string;
  role: "parent" | "child";
  age?: number;
  color: string;
};

export type FamilyRepository = {
  listForUser: (userId: string) => Promise<FamilyMember[]>;
  createForUser: (
    userId: string,
    input: CreateFamilyMemberInput
  ) => Promise<FamilyMember>;
};
