import {
  sendWeeklyBriefingsForActiveUsers,
  type SendWeeklyBriefingsDeps,
} from "@/application/briefing/briefingUseCases";

const mockRepo = {
  upsertForWeek: jest.fn(),
  listRowsForUser: jest.fn(),
  getByIdForUser: jest.fn(),
  recordFeedback: jest.fn(),
};
const mockEmail = jest.fn();
const mockGetEvents = jest.fn();
const mockGetUser = jest.fn();
const mockGenerate = jest.fn();
const mockGetActiveUsers = jest.fn();

const deps: SendWeeklyBriefingsDeps = {
  repo: mockRepo,
  email: mockEmail,
  getEvents: mockGetEvents,
  getUser: mockGetUser,
  generate: mockGenerate,
  getActiveUsers: mockGetActiveUsers,
};

describe("sendWeeklyBriefingsForActiveUsers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerate.mockResolvedValue("Your week ahead...");
    mockEmail.mockResolvedValue({ ok: true });
    mockRepo.upsertForWeek.mockResolvedValue({
      id: "briefing-1",
      weekStart: new Date("2026-03-16T12:00:00.000Z"),
      content: "Your week ahead...",
      sentAt: new Date("2026-03-17T12:00:00.000Z"),
    });
    mockGetEvents.mockResolvedValue([]);
  });

  it("returns sent: 0, total: 0 when no active users", async () => {
    mockGetActiveUsers.mockResolvedValue([]);
    const result = await sendWeeklyBriefingsForActiveUsers(deps);
    expect(result).toEqual({ sent: 0, total: 0 });
  });

  it("generates briefing, sends email, and upserts record for each user", async () => {
    mockGetActiveUsers.mockResolvedValue([
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
        familyMember: { id: "m1", name: "Alex", color: "#f59e0b" },
        title: "Football",
        date: "2026-03-15",
        time: "17:00",
        location: "Park",
        category: "activity",
        source: "manual",
        createdAt: "2026-03-10T10:00:00.000Z",
      },
    ]);

    const result = await sendWeeklyBriefingsForActiveUsers(deps);

    expect(result).toEqual({ sent: 1, total: 1 });
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        familyName: "The Smiths",
        parentName: "Jane",
        events: expect.arrayContaining([
          expect.objectContaining({
            title: "Football",
            date: "2026-03-15",
            time: "17:00",
            familyMember: "Alex",
            category: "activity",
            location: "Park",
          }),
        ]),
      })
    );
    expect(mockRepo.upsertForWeek).toHaveBeenCalled();
    expect(mockEmail).toHaveBeenCalledWith(
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
    mockGetActiveUsers.mockResolvedValue([
      { id: "u1", email: "a@x.com", name: "A", familyName: "F" },
      { id: "u2", email: "b@x.com", name: "B", familyName: "F" },
    ]);
    mockRepo.upsertForWeek
      .mockResolvedValueOnce({
        id: "b1",
        weekStart: new Date("2026-03-16T12:00:00.000Z"),
        content: "c1",
        sentAt: null,
      })
      .mockRejectedValueOnce(new Error("upsert failed"));

    const result = await sendWeeklyBriefingsForActiveUsers(deps);
    expect(result).toEqual({ sent: 1, total: 2 });
  });
});
