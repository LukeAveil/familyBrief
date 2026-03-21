import { supabaseEventRepository } from "@/infrastructure/events/supabaseEventRepository";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

jest.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

const mockFrom = supabaseAdmin.from as jest.Mock;

describe("supabaseEventRepository.listForUser", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("maps Supabase rows into domain events", async () => {
    const selectMock = jest.fn().mockReturnThis();
    const eqMock = jest.fn().mockReturnThis();
    const orderMock = jest.fn().mockResolvedValue({
      data: [
        {
          id: "e1",
          user_id: "u1",
          family_member_id: "m1",
          title: "Practice",
          description: "Football",
          date: "2026-03-13",
          time: "17:00",
          location: "School",
          category: "activity",
          source: "manual",
          raw_email_id: null,
          created_at: "2026-03-10T10:00:00.000Z",
          family_members: {
            id: "m1",
            name: "Alex",
            color: "#f59e0b",
          },
        },
      ],
      error: null,
    });

    mockFrom.mockReturnValue({
      select: selectMock,
      eq: eqMock,
      order: orderMock,
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
    });

    const events = await supabaseEventRepository.listForUser("u1");

    expect(mockFrom).toHaveBeenCalledWith("events");
    expect(selectMock).toHaveBeenCalledWith("*, family_members(id, name, color)");
    expect(eqMock).toHaveBeenCalledWith("user_id", "u1");
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: "e1",
      userId: "u1",
      familyMemberId: "m1",
      familyMember: {
        id: "m1",
        name: "Alex",
        color: "#f59e0b",
      },
      title: "Practice",
      date: "2026-03-13",
      category: "activity",
    });
  });

  it("throws when Supabase returns an error", async () => {
    const orderMock = jest.fn().mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: orderMock,
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
    });

    await expect(supabaseEventRepository.listForUser("u1")).rejects.toThrow(
      "boom"
    );
  });
});
