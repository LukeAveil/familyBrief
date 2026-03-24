/**
 * @jest-environment node
 */
import { File as NodeFile } from "buffer";
// File is not globally available in the Node jest environment
if (!global.File) {
  Object.defineProperty(global, "File", { value: NodeFile, configurable: true });
}

import { POST } from "@/app/api/parse-image/route";
import { NextRequest } from "next/server";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";
import { runProcessParseImageUpload } from "@/application/calendarImport/calendarImportModule";
import type { Event } from "@/types";

jest.mock("@/lib/apiAuth", () => ({
  getAuthedUserIdFromRequest: jest.fn(),
}));
jest.mock("@/application/calendarImport/calendarImportModule", () => ({
  runProcessParseImageUpload: jest.fn(),
}));

const mockAuth = getAuthedUserIdFromRequest as jest.MockedFunction<
  typeof getAuthedUserIdFromRequest
>;
const mockProcess = runProcessParseImageUpload as jest.MockedFunction<
  typeof runProcessParseImageUpload
>;

const mockEvent: Event = {
  id: "e1",
  userId: "u1",
  familyMemberId: null,
  title: "Dentist",
  date: "2026-03-25",
  category: "medical",
  source: "image",
  createdAt: "2026-03-01T00:00:00.000Z",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/parse-image", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/parse-image", {
      method: "POST",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when form data is invalid", async () => {
    mockAuth.mockResolvedValue("u1");
    const req = new NextRequest("http://localhost/api/parse-image", {
      method: "POST",
      body: "not-form-data",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when no file in form data", async () => {
    mockAuth.mockResolvedValue("u1");
    const formData = new FormData();
    const req = new NextRequest("http://localhost/api/parse-image", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/file/i);
  });

  it("returns error response when processing fails", async () => {
    mockAuth.mockResolvedValue("u1");
    mockProcess.mockResolvedValue({
      ok: false,
      message: "Unsupported file type",
      status: 400,
    });
    const formData = new FormData();
    formData.append("file", new File(["data"], "test.xyz", { type: "text/plain" }));
    const req = new NextRequest("http://localhost/api/parse-image", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns extracted events on success", async () => {
    mockAuth.mockResolvedValue("u1");
    mockProcess.mockResolvedValue({
      ok: true,
      events: [mockEvent],
      count: 1,
    });
    const formData = new FormData();
    formData.append("file", new File(["data"], "flyer.jpg", { type: "image/jpeg" }));
    const req = new NextRequest("http://localhost/api/parse-image", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.count).toBe(1);
  });
});
