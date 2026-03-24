import {
  getEventsForUser,
  getEventForUser,
  createManualEventForUser,
  deleteEventForUser,
  insertExtractedEventsForUser,
} from "@/application/events/eventUseCases";
import type { EventRepository } from "@/application/events/eventPorts";
import type { Event } from "@/types";

const mockEvent: Event = {
  id: "e1",
  userId: "u1",
  familyMemberId: null,
  title: "School play",
  date: "2026-03-20",
  category: "school",
  source: "manual",
  createdAt: "2026-03-01T00:00:00.000Z",
};

function makeRepo(overrides: Partial<EventRepository> = {}): EventRepository {
  return {
    listForUser: jest.fn().mockResolvedValue([mockEvent]),
    getByIdForUser: jest.fn().mockResolvedValue(mockEvent),
    createManualForUser: jest.fn().mockResolvedValue(mockEvent),
    deleteForUser: jest.fn().mockResolvedValue(undefined),
    insertExtractedEventsForUser: jest.fn().mockResolvedValue([mockEvent]),
    ...overrides,
  };
}

describe("getEventsForUser", () => {
  it("delegates to repo.listForUser", async () => {
    const repo = makeRepo();
    const result = await getEventsForUser("u1", undefined, repo);
    expect(repo.listForUser).toHaveBeenCalledWith("u1", undefined);
    expect(result).toEqual([mockEvent]);
  });

  it("passes date range filter through", async () => {
    const repo = makeRepo();
    const range = { start: "2026-03-01", end: "2026-03-31" };
    await getEventsForUser("u1", range, repo);
    expect(repo.listForUser).toHaveBeenCalledWith("u1", range);
  });
});

describe("getEventForUser", () => {
  it("delegates to repo.getByIdForUser", async () => {
    const repo = makeRepo();
    const result = await getEventForUser("u1", "e1", repo);
    expect(repo.getByIdForUser).toHaveBeenCalledWith("u1", "e1");
    expect(result).toEqual(mockEvent);
  });

  it("returns null when not found", async () => {
    const repo = makeRepo({ getByIdForUser: jest.fn().mockResolvedValue(null) });
    const result = await getEventForUser("u1", "missing", repo);
    expect(result).toBeNull();
  });
});

describe("createManualEventForUser", () => {
  it("delegates to repo.createManualForUser", async () => {
    const repo = makeRepo();
    const input = {
      title: "School play",
      date: "2026-03-20",
      category: "school" as const,
      familyMemberId: null,
    };
    const result = await createManualEventForUser("u1", input, repo);
    expect(repo.createManualForUser).toHaveBeenCalledWith("u1", input);
    expect(result).toEqual(mockEvent);
  });
});

describe("deleteEventForUser", () => {
  it("delegates to repo.deleteForUser", async () => {
    const repo = makeRepo();
    await deleteEventForUser("u1", "e1", repo);
    expect(repo.deleteForUser).toHaveBeenCalledWith("u1", "e1");
  });
});

describe("insertExtractedEventsForUser", () => {
  it("delegates to repo.insertExtractedEventsForUser", async () => {
    const repo = makeRepo();
    const rows = [
      {
        title: "Dentist",
        date: "2026-03-25",
        category: "medical" as const,
        source: "email" as const,
        familyMemberId: null,
      },
    ];
    const result = await insertExtractedEventsForUser("u1", rows, repo);
    expect(repo.insertExtractedEventsForUser).toHaveBeenCalledWith("u1", rows);
    expect(result).toEqual([mockEvent]);
  });
});
