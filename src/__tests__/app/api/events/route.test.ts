/**
 * @jest-environment node
 */
import { GET, POST, DELETE } from "@/app/api/events/route";
import { NextRequest } from "next/server";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";
import {
  runGetEventsForUser,
  runCreateManualEventForUser,
  runGetEventForUser,
  runDeleteEventForUser,
} from "@/application/events/eventModule";
import { runSyncBriefingsForDates } from "@/application/briefing/briefingModule";
import type { Event } from "@/types";

jest.mock("@/lib/apiAuth", () => ({
  getAuthedUserIdFromRequest: jest.fn(),
}));
jest.mock("@/application/events/eventModule", () => ({
  runGetEventsForUser: jest.fn(),
  runCreateManualEventForUser: jest.fn(),
  runGetEventForUser: jest.fn(),
  runDeleteEventForUser: jest.fn(),
}));
jest.mock("@/application/briefing/briefingModule", () => ({
  runSyncBriefingsForDates: jest.fn().mockResolvedValue(undefined),
}));

const mockAuth = getAuthedUserIdFromRequest as jest.MockedFunction<
  typeof getAuthedUserIdFromRequest
>;
const mockGetEvents = runGetEventsForUser as jest.MockedFunction<
  typeof runGetEventsForUser
>;
const mockCreate = runCreateManualEventForUser as jest.MockedFunction<
  typeof runCreateManualEventForUser
>;
const mockGetEvent = runGetEventForUser as jest.MockedFunction<
  typeof runGetEventForUser
>;
const mockDelete = runDeleteEventForUser as jest.MockedFunction<
  typeof runDeleteEventForUser
>;

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

beforeEach(() => {
  jest.clearAllMocks();
  (runSyncBriefingsForDates as jest.MockedFunction<typeof runSyncBriefingsForDates>).mockResolvedValue(undefined);
});

describe("GET /api/events", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/events");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns events list", async () => {
    mockAuth.mockResolvedValue("u1");
    mockGetEvents.mockResolvedValue([mockEvent]);
    const req = new NextRequest("http://localhost/api/events");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(json[0].id).toBe("e1");
  });
});

describe("POST /api/events", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({ title: "Test", date: "2026-03-20", category: "other" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when required fields missing", async () => {
    mockAuth.mockResolvedValue("u1");
    const req = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({ category: "other" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates event and returns 200", async () => {
    mockAuth.mockResolvedValue("u1");
    mockCreate.mockResolvedValue(mockEvent);
    const req = new NextRequest("http://localhost/api/events", {
      method: "POST",
      body: JSON.stringify({ title: "School play", date: "2026-03-20", category: "school" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("e1");
  });
});

describe("DELETE /api/events", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/events?id=e1", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when id missing", async () => {
    mockAuth.mockResolvedValue("u1");
    const req = new NextRequest("http://localhost/api/events", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it("deletes event and returns success", async () => {
    mockAuth.mockResolvedValue("u1");
    mockGetEvent.mockResolvedValue(mockEvent);
    mockDelete.mockResolvedValue(undefined);
    const req = new NextRequest("http://localhost/api/events?id=e1", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
