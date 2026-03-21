import type {
  UpsertUserProfileInput,
  UserProfile,
} from "@/application/user/userPorts";
import {
  getUserProfile,
  listActiveSubscribedUsers,
  upsertUserProfile,
} from "@/application/user/userUseCases";
import { supabaseUserRepository } from "@/infrastructure/user/supabaseUserRepository";

export function runGetUserProfile(userId: string) {
  return getUserProfile(userId, supabaseUserRepository);
}

export function runUpsertUserProfile(
  userId: string,
  input: UpsertUserProfileInput
): Promise<UserProfile> {
  return upsertUserProfile(userId, input, supabaseUserRepository);
}

export function runGetActiveSubscribedUsers() {
  return listActiveSubscribedUsers(supabaseUserRepository);
}
