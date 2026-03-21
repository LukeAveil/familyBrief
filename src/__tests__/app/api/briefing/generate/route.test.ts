/**
 * @jest-environment node
 */
import { POST } from "@/app/api/briefing/generate/route";
import { NextRequest } from "next/server";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";
import { runGenerateBriefingForUserWeek } from "@/application/briefing/briefingModule";

jest.mock("@/lib/apiAuth", () => ({
  getAuthedUserIdFromRequest: jest.fn(),
}));
jest.mock("@/application/briefing/briefingModule", () => ({
  runGenerateBriefingForUserWeek: jest.fn(),
}));

const mockAuth = getAuthedUserIdFromRequest as jest.MockedFunction<
  typeof getAuthedUserIdFromRequest
>;
const mockRun = runGenerateBriefingForUserWeek as jest.MockedFunction<
  typeof runGenerateBriefingForUserWeek
>;

describe("POST /api/briefing/generate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/briefing/generate", {
      method: "POST",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns success payload when generation succeeds", async () => {
    mockAuth.mockResolvedValue("user-1");
    mockRun.mockResolvedValue({
      briefing: {
        id: "b1",
        content: "Hello",
        weekStart: new Date("2026-03-16T12:00:00.000Z"),
        sentAt: new Date("2026-03-17T12:00:00.000Z"),
      },
      emailSent: true,
    });

    const req = new NextRequest("http://localhost/api/briefing/generate", {
      method: "POST",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.briefing.id).toBe("b1");
    expect(json.emailSent).toBe(true);
  });
});
