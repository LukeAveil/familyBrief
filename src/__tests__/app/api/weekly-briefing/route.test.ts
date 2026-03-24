/**
 * @jest-environment node
 */
import { POST } from "@/app/api/weekly-briefing/route";
import { NextRequest } from "next/server";
import { runSendWeeklyBriefingsForActiveUsers } from "@/application/briefing/briefingModule";

jest.mock("@/application/briefing/briefingModule", () => ({
  runSendWeeklyBriefingsForActiveUsers: jest.fn(),
}));

const mockSend = runSendWeeklyBriefingsForActiveUsers as jest.MockedFunction<
  typeof runSendWeeklyBriefingsForActiveUsers
>;

function makeReq(authorization?: string): NextRequest {
  return new NextRequest("http://localhost/api/weekly-briefing", {
    method: "POST",
    headers: authorization ? { authorization } : {},
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.CRON_SECRET = "test-secret";
});

describe("POST /api/weekly-briefing", () => {
  it("returns 401 when no authorization header", async () => {
    const res = await POST(makeReq());
    expect(res.status).toBe(401);
  });

  it("returns 401 when wrong secret", async () => {
    const res = await POST(makeReq("Bearer wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("sends briefings and returns result when authorized", async () => {
    mockSend.mockResolvedValue({ sent: 3, total: 3 });
    const res = await POST(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sent).toBe(3);
    expect(json.total).toBe(3);
  });
});
