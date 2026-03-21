/**
 * @jest-environment node
 */
import { GET } from "@/app/api/briefing/list/route";
import { NextRequest } from "next/server";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";
import { listBriefingItemsForUser } from "@/application/briefing/briefingUseCases";

jest.mock("@/lib/apiAuth", () => ({
  getAuthedUserIdFromRequest: jest.fn(),
}));
jest.mock("@/application/briefing/briefingUseCases", () => ({
  listBriefingItemsForUser: jest.fn(),
}));
jest.mock("@/infrastructure/briefing/supabaseBriefingRepository", () => ({
  supabaseBriefingRepository: {},
}));

const mockAuth = getAuthedUserIdFromRequest as jest.MockedFunction<
  typeof getAuthedUserIdFromRequest
>;
const mockList = listBriefingItemsForUser as jest.MockedFunction<
  typeof listBriefingItemsForUser
>;

describe("GET /api/briefing/list", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/briefing/list");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns briefings JSON", async () => {
    mockAuth.mockResolvedValue("user-1");
    mockList.mockResolvedValue([
      {
        id: "1",
        weekStart: new Date("2026-03-16T12:00:00.000Z"),
        content: "Hi",
        createdAt: new Date("2026-03-17T00:00:00.000Z"),
      },
    ]);

    const req = new NextRequest("http://localhost/api/briefing/list");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(json[0].id).toBe("1");
  });
});
