import { sendWeeklyBriefingsForActiveUsers } from "@/services/briefingService";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateWeeklyBriefing } from "@/lib/anthropic";
import { sendWeeklyBriefing } from "@/lib/email";

jest.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));
jest.mock("@/lib/anthropic", () => ({
  generateWeeklyBriefing: jest.fn(),
}));
jest.mock("@/lib/email", () => ({
  sendWeeklyBriefing: jest.fn(),
}));

const mockFrom = supabaseAdmin.from as jest.Mock;
const mockGenerateWeeklyBriefing = generateWeeklyBriefing as jest.Mock;
const mockSendWeeklyBriefing = sendWeeklyBriefing as jest.Mock;

describe("briefingService.sendWeeklyBriefingsForActiveUsers", () => {
  beforeEach(() => {
    mockGenerateWeeklyBriefing.mockResolvedValue("Your week ahead...");
    mockSendWeeklyBriefing.mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns sent: 0, total: 0 when no active users", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {};
    });

    const result = await sendWeeklyBriefingsForActiveUsers();
    expect(result).toEqual({ sent: 0, total: 0 });
  });

  it("fetches active users, generates briefing, sends email, and inserts record", async () => {
    const users = [
      {
        id: "u1",
        email: "parent@example.com",
        name: "Jane",
        family_name: "The Smiths",
      },
    ];
    const events = [
      {
        id: "e1",
        title: "Football",
        date: "2026-03-15",
        time: "17:00",
        family_members: { name: "Alex" },
        category: "activity",
        location: "Park",
      },
    ];

    let fromCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      fromCallCount++;
      if (table === "users") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: users, error: null }),
        };
      }
      if (table === "events") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: events, error: null }),
        };
      }
      if (table === "weekly_briefings") {
        return {
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return {};
    });

    const result = await sendWeeklyBriefingsForActiveUsers();

    expect(result).toEqual({ sent: 1, total: 1 });
    expect(mockGenerateWeeklyBriefing).toHaveBeenCalledWith(
      "The Smiths",
      "Jane",
      expect.arrayContaining([
        expect.objectContaining({
          title: "Football",
          date: "2026-03-15",
          time: "17:00",
          familyMember: "Alex",
          category: "activity",
          location: "Park",
        }),
      ])
    );
    expect(mockSendWeeklyBriefing).toHaveBeenCalledWith(
      "parent@example.com",
      "Jane",
      "Your week ahead...",
      expect.any(String)
    );
    expect(mockFrom).toHaveBeenCalledWith("weekly_briefings");
  });

  it("returns sent count excluding rejected promises", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [
              { id: "u1", email: "a@x.com", name: "A", family_name: "F" },
              { id: "u2", email: "b@x.com", name: "B", family_name: "F" },
            ],
            error: null,
          }),
        };
      }
      if (table === "events") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === "weekly_briefings") {
        return {
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return {};
    });
    mockSendWeeklyBriefing
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("Resend failed"));

    const result = await sendWeeklyBriefingsForActiveUsers();
    expect(result).toEqual({ sent: 1, total: 2 });
  });
});
