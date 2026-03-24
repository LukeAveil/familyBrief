import {
  getFamilyMembersForUser,
  createFamilyMemberForUser,
} from "@/application/family/familyUseCases";
import type { FamilyRepository } from "@/application/family/familyPorts";
import type { FamilyMember } from "@/types";

const mockMember: FamilyMember = {
  id: "fm1",
  userId: "u1",
  name: "Alice",
  role: "child",
  color: "#f59e0b",
};

function makeRepo(overrides: Partial<FamilyRepository> = {}): FamilyRepository {
  return {
    listForUser: jest.fn().mockResolvedValue([mockMember]),
    createForUser: jest.fn().mockResolvedValue(mockMember),
    ...overrides,
  };
}

describe("getFamilyMembersForUser", () => {
  it("delegates to repo.listForUser", async () => {
    const repo = makeRepo();
    const result = await getFamilyMembersForUser("u1", repo);
    expect(repo.listForUser).toHaveBeenCalledWith("u1");
    expect(result).toEqual([mockMember]);
  });

  it("returns empty array when no members", async () => {
    const repo = makeRepo({ listForUser: jest.fn().mockResolvedValue([]) });
    const result = await getFamilyMembersForUser("u1", repo);
    expect(result).toEqual([]);
  });
});

describe("createFamilyMemberForUser", () => {
  it("delegates to repo.createForUser", async () => {
    const repo = makeRepo();
    const input = { name: "Alice", role: "child" as const, color: "#f59e0b" };
    const result = await createFamilyMemberForUser("u1", input, repo);
    expect(repo.createForUser).toHaveBeenCalledWith("u1", input);
    expect(result).toEqual(mockMember);
  });
});
