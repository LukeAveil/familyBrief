import { sendWeeklyBriefingsForActiveUsers } from "@/services/briefingService";
import { runGetEventsForUser } from "@/application/events/eventModule";
import { runGetActiveSubscribedUsers } from "@/application/user/userModule";
import { generateWeeklyBriefing } from "@/lib/anthropic";
import { sendWeeklyBriefingEmail } from "@/lib/email";
import { supabaseBriefingRepository } from "@/infrastructure/briefing/supabaseBriefingRepository";

jest.mock("@/application/user/userModule", () => ({
  runGetActiveSubscribedUsers: jest.fn(),
}));
jest.mock("@/application/events/eventModule", () => ({
  runGetEventsForUser: jest.fn(),
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

const mockActiveUsers = runGetActiveSubscribedUsers as jest.MockedFunction<
  typeof runGetActiveSubscribedUsers
>;
const mockGetEvents = runGetEventsForUser as jest.MockedFunction<
  typeof runGetEventsForUser
>;
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
    mockGetEvents.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns sent: 0, total: 0 when no active users", async () => {
    mockActiveUsers.mockResolvedValue([]);

    const result = await sendWeeklyBriefingsForActiveUsers();
    expect(result).toEqual({ sent: 0, total: 0 });
  });

  it("fetches active users, generates briefing, sends email, and upserts record", async () => {
    mockActiveUsers.mockResolvedValue([
      {
        id: "u1",
        email: "parent@example.com",
        name: "Jane",
        familyName: "The Smiths",
      },
    ]);
    mockGetEvents.mockResolvedValue([
      {
        id: "e1",
        userId: "u1",
        familyMemberId: "m1",
        familyMember: {
          id: "m1",
          name: "Alex",
          color: "#f59e0b",
        },
        title: "Football",
        date: "2026-03-15",
        time: "17:00",
        location: "Park",
        category: "activity",
        source: "manual",
        createdAt: "2026-03-10T10:00:00.000Z",
      },
    ]);

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
    mockActiveUsers.mockResolvedValue([
      {
        id: "u1",
        email: "a@x.com",
        name: "A",
        familyName: "F",
      },
      {
        id: "u2",
        email: "b@x.com",
        name: "B",
        familyName: "F",
      },
    ]);
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
