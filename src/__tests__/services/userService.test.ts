import {
  getUserProfile,
  upsertUserProfileForUser,
} from "@/services/userService";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

jest.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

const mockFrom = supabaseAdmin.from as jest.Mock;

describe("userService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserProfile", () => {
    it("maps user row to UserProfile and returns it", async () => {
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const maybeSingleMock = jest.fn().mockResolvedValue({
        data: {
          id: "u1",
          email: "parent@example.com",
          name: "Jane",
          family_name: "The Smiths",
        },
        error: null,
      });

      mockFrom.mockReturnValue({
        select: selectMock,
        eq: eqMock,
        maybeSingle: maybeSingleMock,
      });

      const profile = await getUserProfile("u1");

      expect(mockFrom).toHaveBeenCalledWith("users");
      expect(selectMock).toHaveBeenCalledWith("id,email,name,family_name");
      expect(eqMock).toHaveBeenCalledWith("id", "u1");
      expect(profile).toMatchObject({
        id: "u1",
        email: "parent@example.com",
        name: "Jane",
        familyName: "The Smiths",
      });
    });

    it("returns null when no user found", async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const profile = await getUserProfile("u1");
      expect(profile).toBeNull();
    });

    it("throws when Supabase returns an error", async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "db error" },
        }),
      });

      await expect(getUserProfile("u1")).rejects.toThrow("db error");
    });
  });

  describe("upsertUserProfileForUser", () => {
    it("upserts and returns mapped UserProfile", async () => {
      const upsertMock = jest.fn().mockReturnThis();
      const selectMock = jest.fn().mockReturnThis();
      const singleMock = jest.fn().mockResolvedValue({
        data: {
          id: "u1",
          email: "jane@example.com",
          name: "Jane",
          family_name: "The Smiths",
        },
        error: null,
      });

      mockFrom.mockReturnValue({
        upsert: upsertMock,
        select: selectMock,
        single: singleMock,
      });

      const profile = await upsertUserProfileForUser("u1", {
        name: "Jane",
        familyName: "The Smiths",
        email: "jane@example.com",
      });

      expect(mockFrom).toHaveBeenCalledWith("users");
      expect(upsertMock).toHaveBeenCalledWith(
        {
          id: "u1",
          email: "jane@example.com",
          name: "Jane",
          family_name: "The Smiths",
        },
        { onConflict: "id" }
      );
      expect(profile).toMatchObject({
        id: "u1",
        email: "jane@example.com",
        name: "Jane",
        familyName: "The Smiths",
      });
    });

    it("throws when Supabase returns an error", async () => {
      mockFrom.mockReturnValue({
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "upsert failed" },
        }),
      });

      await expect(
        upsertUserProfileForUser("u1", {
          name: "Jane",
          familyName: "The Smiths",
          email: "jane@example.com",
        })
      ).rejects.toThrow("upsert failed");
    });
  });
});
