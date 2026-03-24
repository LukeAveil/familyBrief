/**
 * @jest-environment node
 */
import { POST } from "@/app/api/parse-email/route";
import { NextRequest } from "next/server";
import { runInsertExtractedEventsForUser } from "@/application/events/eventModule";
import { runGetFamilyMembersForUser } from "@/application/family/familyModule";
import { runRecordParsedEmail } from "@/application/parsedEmail/parsedEmailModule";
import { parseEmailToEvents } from "@/lib/anthropic";
import { runSyncBriefingsForDates } from "@/application/briefing/briefingModule";

jest.mock("@/application/events/eventModule", () => ({
  runInsertExtractedEventsForUser: jest.fn().mockResolvedValue([]),
}));
jest.mock("@/application/family/familyModule", () => ({
  runGetFamilyMembersForUser: jest.fn().mockResolvedValue([]),
}));
jest.mock("@/application/parsedEmail/parsedEmailModule", () => ({
  runRecordParsedEmail: jest.fn().mockResolvedValue({ id: "pe1" }),
}));
jest.mock("@/lib/anthropic", () => ({
  parseEmailToEvents: jest.fn().mockResolvedValue([]),
}));
jest.mock("@/application/briefing/briefingModule", () => ({
  runSyncBriefingsForDates: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/domain/calendarImport", () => ({
  buildInsertRowsFromExtracted: jest.fn().mockReturnValue([]),
}));

const mockGetMembers = runGetFamilyMembersForUser as jest.MockedFunction<
  typeof runGetFamilyMembersForUser
>;

function makeReq(body: object): NextRequest {
  return new NextRequest("http://localhost/api/parse-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetMembers.mockResolvedValue([]);
  (parseEmailToEvents as jest.MockedFunction<typeof parseEmailToEvents>).mockResolvedValue([]);
  (runRecordParsedEmail as jest.MockedFunction<typeof runRecordParsedEmail>).mockResolvedValue({ id: "pe1" });
  (runInsertExtractedEventsForUser as jest.MockedFunction<typeof runInsertExtractedEventsForUser>).mockResolvedValue([]);
  (runSyncBriefingsForDates as jest.MockedFunction<typeof runSyncBriefingsForDates>).mockResolvedValue(undefined);
});

const validBody = {
  to: "family+user-123@familybrief.app",
  from: "teacher@school.com",
  subject: "Soccer practice",
  text: "Practice is Tuesday at 4pm",
};

describe("POST /api/parse-email", () => {
  it("returns 400 when body is missing required fields", async () => {
    const req = makeReq({ from: "a@b.com" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when to address does not contain userId", async () => {
    const req = makeReq({ ...validBody, to: "invalid@familybrief.app" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns success with eventsCreated 0 when no events extracted", async () => {
    const req = makeReq(validBody);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.eventsCreated).toBe(0);
  });
});
