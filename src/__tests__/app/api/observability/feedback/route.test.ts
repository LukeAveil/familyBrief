/**
 * @jest-environment node
 */
import { POST } from "@/app/api/observability/feedback/route";
import { NextRequest } from "next/server";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";
import { runRecordBriefingFeedback } from "@/application/briefing/briefingModule";
import { BriefingNotFoundError } from "@/application/briefing/briefingUseCases";

jest.mock("@/lib/apiAuth", () => ({
  getAuthedUserIdFromRequest: jest.fn(),
}));
jest.mock("@/application/briefing/briefingModule", () => ({
  runRecordBriefingFeedback: jest.fn(),
}));

const mockAuth = getAuthedUserIdFromRequest as jest.MockedFunction<
  typeof getAuthedUserIdFromRequest
>;
const mockRun = runRecordBriefingFeedback as jest.MockedFunction<
  typeof runRecordBriefingFeedback
>;

describe("POST /api/observability/feedback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRun.mockResolvedValue(undefined);
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
    expect(mockRun).toHaveBeenCalledWith("u1", "b1", "up");
  });

  it("returns 404 when briefing not found", async () => {
    mockAuth.mockResolvedValue("u1");
    mockRun.mockRejectedValue(new BriefingNotFoundError());
    const req = new NextRequest("http://localhost/api/observability/feedback", {
      method: "POST",
      body: JSON.stringify({ briefingId: "missing", sentiment: "down" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });
});
