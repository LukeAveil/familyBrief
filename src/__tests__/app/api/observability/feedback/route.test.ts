/**
 * @jest-environment node
 */
import { POST } from "@/app/api/observability/feedback/route";
import { NextRequest } from "next/server";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";
import { recordBriefingFeedback } from "@/application/briefing/briefingUseCases";

jest.mock("@/lib/apiAuth", () => ({
  getAuthedUserIdFromRequest: jest.fn(),
}));
jest.mock("@/infrastructure/briefing/supabaseBriefingRepository", () => ({
  supabaseBriefingRepository: {},
}));
jest.mock("@/application/briefing/briefingUseCases", () => {
  const actual = jest.requireActual<
    typeof import("@/application/briefing/briefingUseCases")
  >("@/application/briefing/briefingUseCases");
  return {
    ...actual,
    recordBriefingFeedback: jest.fn().mockResolvedValue(undefined),
  };
});

const mockAuth = getAuthedUserIdFromRequest as jest.MockedFunction<
  typeof getAuthedUserIdFromRequest
>;
const mockRecord = recordBriefingFeedback as jest.MockedFunction<
  typeof recordBriefingFeedback
>;

describe("POST /api/observability/feedback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRecord.mockResolvedValue(undefined);
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/observability/feedback", {
      method: "POST",
      body: JSON.stringify({ briefingId: "b1", sentiment: "up" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when sentiment invalid", async () => {
    mockAuth.mockResolvedValue("u1");
    const req = new NextRequest("http://localhost/api/observability/feedback", {
      method: "POST",
      body: JSON.stringify({ briefingId: "b1", sentiment: "maybe" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when briefingId missing", async () => {
    mockAuth.mockResolvedValue("u1");
    const req = new NextRequest("http://localhost/api/observability/feedback", {
      method: "POST",
      body: JSON.stringify({ sentiment: "up" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 when feedback recorded", async () => {
    mockAuth.mockResolvedValue("u1");
    const req = new NextRequest("http://localhost/api/observability/feedback", {
      method: "POST",
      body: JSON.stringify({ briefingId: "b1", sentiment: "up" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockRecord).toHaveBeenCalledWith(
      "u1",
      "b1",
      "up",
      expect.objectContaining({ repo: expect.any(Object) })
    );
  });
});
