import type {
  UpsertUserProfileInput,
  UserProfile,
  UserRepository,
} from "@/application/user/userPorts";

export async function getUserProfile(
  userId: string,
  repo: UserRepository
): Promise<UserProfile | null> {
  return repo.getById(userId);
}

export async function upsertUserProfile(
  userId: string,
  input: UpsertUserProfileInput,
  repo: UserRepository
): Promise<UserProfile> {
  return repo.upsert(userId, input);
}
