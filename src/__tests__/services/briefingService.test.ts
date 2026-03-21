import { sendWeeklyBriefingsForActiveUsers } from "@/services/briefingService";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateWeeklyBriefing } from "@/lib/anthropic";
import { sendWeeklyBriefingEmail } from "@/lib/email";
import { supabaseBriefingRepository } from "@/infrastructure/briefing/supabaseBriefingRepository";

jest.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));
jest.mock("@/lib/anthropic", () => ({
  generateWeeklyBriefing: jest.fn(),
}));
jest.mock("@/lib/email", () => ({
  sendWeeklyBriefingEmail: jest.fn(),
}));
jest.mock("@/infrastructure/briefing/supabaseBriefingRepository", () => ({
  supabaseBriefingRepository: {
    upsertForWeek: jest.fn(),
  },
}));

const mockFrom = supabaseAdmin.from as jest.Mock;
const mockGenerateWeeklyBriefing = generateWeeklyBriefing as jest.Mock;
const mockSendWeeklyBriefingEmail = sendWeeklyBriefingEmail as jest.Mock;
const mockUpsert = supabaseBriefingRepository.upsertForWeek as jest.Mock;

describe("briefingService.sendWeeklyBriefingsForActiveUsers", () => {
  beforeEach(() => {
    mockGenerateWeeklyBriefing.mockResolvedValue("Your week ahead...");
    mockSendWeeklyBriefingEmail.mockResolvedValue({ ok: true });
    mockUpsert.mockResolvedValue({
      id: "briefing-1",
      weekStart: new Date("2026-03-16T12:00:00.000Z"),
      content: "Your week ahead...",
      sentAt: new Date("2026-03-17T12:00:00.000Z"),
    });
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

  it("fetches active users, generates briefing, sends email, and upserts record", async () => {
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

    mockFrom.mockImplementation((table: string) => {
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
    expect(mockUpsert).toHaveBeenCalled();
    expect(mockSendWeeklyBriefingEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        toEmail: "parent@example.com",
        toName: "Jane",
        familyName: "The Smiths",
        briefingContent: "Your week ahead...",
        briefingId: "briefing-1",
      })
    );
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
      return {};
    });
    mockUpsert
      .mockResolvedValueOnce({
        id: "b1",
        weekStart: new Date("2026-03-16T12:00:00.000Z"),
        content: "c1",
        sentAt: null,
      })
      .mockRejectedValueOnce(new Error("upsert failed"));

    const result = await sendWeeklyBriefingsForActiveUsers();
    expect(result).toEqual({ sent: 1, total: 2 });
  });
});
