import { supabaseFamilyRepository } from "@/infrastructure/family/supabaseFamilyRepository";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

jest.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

const mockFrom = supabaseAdmin.from as jest.Mock;

describe("supabaseFamilyRepository.listForUser", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("maps Supabase rows into domain family members", async () => {
    const selectMock = jest.fn().mockReturnThis();
    const eqMock = jest.fn().mockResolvedValue({
      data: [
        {
          id: "m1",
          user_id: "u1",
          name: "Alex",
          role: "child",
          age: 10,
          color: "#f59e0b",
        },
      ],
      error: null,
    });

    mockFrom.mockReturnValue({
      select: selectMock,
      eq: eqMock,
    });

    const members = await supabaseFamilyRepository.listForUser("u1");

    expect(mockFrom).toHaveBeenCalledWith("family_members");
    expect(selectMock).toHaveBeenCalledWith("*");
    expect(eqMock).toHaveBeenCalledWith("user_id", "u1");
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({
      id: "m1",
      userId: "u1",
      name: "Alex",
      role: "child",
      age: 10,
      color: "#f59e0b",
    });
  });

  it("throws when Supabase returns an error", async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "boom" },
      }),
    });

    await expect(supabaseFamilyRepository.listForUser("u1")).rejects.toThrow(
      "boom"
    );
  });
});
