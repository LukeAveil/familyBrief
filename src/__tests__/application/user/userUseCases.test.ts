import {
  getUserProfile,
  upsertUserProfile,
  listActiveSubscribedUsers,
} from "@/application/user/userUseCases";
import type { UserRepository, UserProfile } from "@/application/user/userPorts";

const mockProfile: UserProfile = {
  id: "u1",
  email: "alice@example.com",
  name: "Alice",
  familyName: "Smith",
};

function makeRepo(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    getById: jest.fn().mockResolvedValue(mockProfile),
    upsert: jest.fn().mockResolvedValue(mockProfile),
    listActiveSubscribed: jest.fn().mockResolvedValue([mockProfile]),
    ...overrides,
  };
}

describe("getUserProfile", () => {
  it("delegates to repo.getById", async () => {
    const repo = makeRepo();
    const result = await getUserProfile("u1", repo);
    expect(repo.getById).toHaveBeenCalledWith("u1");
    expect(result).toEqual(mockProfile);
  });

  it("returns null when not found", async () => {
    const repo = makeRepo({ getById: jest.fn().mockResolvedValue(null) });
    const result = await getUserProfile("missing", repo);
    expect(result).toBeNull();
  });
});

describe("upsertUserProfile", () => {
  it("delegates to repo.upsert", async () => {
    const repo = makeRepo();
    const input = { name: "Alice", familyName: "Smith", email: "alice@example.com" };
    const result = await upsertUserProfile("u1", input, repo);
    expect(repo.upsert).toHaveBeenCalledWith("u1", input);
    expect(result).toEqual(mockProfile);
  });
});

describe("listActiveSubscribedUsers", () => {
  it("delegates to repo.listActiveSubscribed", async () => {
    const repo = makeRepo();
    const result = await listActiveSubscribedUsers(repo);
    expect(repo.listActiveSubscribed).toHaveBeenCalled();
    expect(result).toEqual([mockProfile]);
  });

  it("returns empty array when no active users", async () => {
    const repo = makeRepo({ listActiveSubscribed: jest.fn().mockResolvedValue([]) });
    const result = await listActiveSubscribedUsers(repo);
    expect(result).toEqual([]);
  });
});
