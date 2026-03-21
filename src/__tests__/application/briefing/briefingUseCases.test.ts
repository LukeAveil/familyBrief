import {
  generateBriefingForUserWeek,
  listBriefingItemsForUser,
  BriefingNotFoundError,
  recordBriefingFeedback,
} from "@/application/briefing/briefingUseCases";
import type {
  BriefingRepository,
  EventQueryPort,
  WeeklyBriefingEmailPort,
} from "@/application/briefing/briefingPorts";
import { toIsoDateString } from "@/lib/briefing/week";

jest.mock("@/services/userService", () => ({
  getUserProfile: jest.fn(),
}));
jest.mock("@/lib/briefing/week", () => {
  const actual = jest.requireActual<typeof import("@/lib/briefing/week")>(
    "@/lib/briefing/week"
  );
  return {
    ...actual,
    getToday: () => actual.parseIsoDate("2026-03-18"),
  };
});

import { getUserProfile } from "@/services/userService";

const mockGetUserProfile = getUserProfile as jest.MockedFunction<
  typeof getUserProfile
>;

describe("generateBriefingForUserWeek", () => {
  const repo: BriefingRepository = {
    listRowsForUser: jest.fn(),
    upsertForWeek: jest.fn().mockResolvedValue({
      id: "bid",
      weekStart: new Date("2026-03-16T12:00:00.000Z"),
      content: "Generated",
      sentAt: new Date("2026-03-16T12:00:00.000Z"),
    }),
    getByIdForUser: jest.fn(),
  };

  const email: WeeklyBriefingEmailPort = jest.fn().mockResolvedValue({
    ok: true,
  });

  const getEvents: EventQueryPort = jest.fn().mockResolvedValue([]);

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserProfile.mockResolvedValue({
      id: "u1",
      email: "p@x.com",
      name: "Pat",
      familyName: "Rivera",
    });
  });

  it("generates, upserts, sends email, and returns emailSent true", async () => {
    const generate = jest.fn().mockResolvedValue("Generated");

    const result = await generateBriefingForUserWeek("u1", {
      repo,
      email,
      getEvents,
      getFamilyMembers: jest.fn().mockResolvedValue([]),
      generate,
    });

    expect(generate).toHaveBeenCalled();
    expect(repo.upsertForWeek).toHaveBeenCalled();
    expect(email).toHaveBeenCalled();
    expect(result.emailSent).toBe(true);
    expect(result.briefing.id).toBe("bid");
  });

  it("returns emailSent false when email port fails without throwing", async () => {
    const emailFail: WeeklyBriefingEmailPort = jest
      .fn()
      .mockResolvedValue({ ok: false, error: "smtp" });

    const result = await generateBriefingForUserWeek("u1", {
      repo,
      email: emailFail,
      getEvents,
      getFamilyMembers: jest.fn().mockResolvedValue([]),
      generate: jest.fn().mockResolvedValue("X"),
    });

    expect(result.emailSent).toBe(false);
  });
});

describe("listBriefingItemsForUser", () => {
  it("maps rows to list items", async () => {
    const repo: BriefingRepository = {
      listRowsForUser: jest.fn().mockResolvedValue([
        {
          id: "1",
          weekStart: new Date("2026-03-16T12:00:00.000Z"),
          content: "Hi",
          sentAt: null,
          createdAt: new Date("2026-03-16T00:00:00.000Z"),
        },
      ]),
      upsertForWeek: jest.fn(),
      getByIdForUser: jest.fn(),
    };

    const items = await listBriefingItemsForUser("u1", repo);
    expect(items).toHaveLength(1);
    expect(toIsoDateString(items[0].weekStart)).toBe("2026-03-16");
  });
});

describe("recordBriefingFeedback", () => {
  it("throws when briefing not found", async () => {
    const repo: BriefingRepository = {
      listRowsForUser: jest.fn(),
      upsertForWeek: jest.fn(),
      getByIdForUser: jest.fn().mockResolvedValue(null),
    };

    await expect(
      recordBriefingFeedback("u1", "missing", "up", { repo })
    ).rejects.toBeInstanceOf(BriefingNotFoundError);
  });

  it("resolves when briefing exists", async () => {
    const repo: BriefingRepository = {
      listRowsForUser: jest.fn(),
      upsertForWeek: jest.fn(),
      getByIdForUser: jest.fn().mockResolvedValue({
        id: "1",
        weekStart: new Date("2026-03-16T12:00:00.000Z"),
        content: "c",
        sentAt: null,
        createdAt: new Date("2026-03-16T00:00:00.000Z"),
      }),
    };

    await expect(
      recordBriefingFeedback("u1", "1", "down", { repo })
    ).resolves.toBeUndefined();
  });
});
