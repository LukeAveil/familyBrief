import { supabaseUserRepository } from "@/infrastructure/user/supabaseUserRepository";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

jest.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

const mockFrom = supabaseAdmin.from as jest.Mock;

describe("supabaseUserRepository", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getById", () => {
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

      const profile = await supabaseUserRepository.getById("u1");

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

      const profile = await supabaseUserRepository.getById("u1");
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

      await expect(supabaseUserRepository.getById("u1")).rejects.toThrow(
        "db error"
      );
    });
  });

  describe("upsert", () => {
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

      const profile = await supabaseUserRepository.upsert("u1", {
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
        supabaseUserRepository.upsert("u1", {
          name: "Jane",
          familyName: "The Smiths",
          email: "jane@example.com",
        })
      ).rejects.toThrow("upsert failed");
    });
  });
});
