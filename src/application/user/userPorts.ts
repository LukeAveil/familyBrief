export type UserProfile = {
  id: string;
  email: string;
  name: string;
  familyName: string;
};

export type UpsertUserProfileInput = {
  name: string;
  familyName: string;
  email: string;
};

export type UserRepository = {
  getById(userId: string): Promise<UserProfile | null>;
  upsert(userId: string, input: UpsertUserProfileInput): Promise<UserProfile>;
};
