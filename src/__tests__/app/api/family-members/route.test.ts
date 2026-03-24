/**
 * @jest-environment node
 */
import { GET, POST } from "@/app/api/family-members/route";
import { NextRequest } from "next/server";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";
import {
  runGetFamilyMembersForUser,
  runCreateFamilyMemberForUser,
} from "@/application/family/familyModule";
import type { FamilyMember } from "@/types";

jest.mock("@/lib/apiAuth", () => ({
  getAuthedUserIdFromRequest: jest.fn(),
}));
jest.mock("@/application/family/familyModule", () => ({
  runGetFamilyMembersForUser: jest.fn(),
  runCreateFamilyMemberForUser: jest.fn(),
}));

const mockAuth = getAuthedUserIdFromRequest as jest.MockedFunction<
  typeof getAuthedUserIdFromRequest
>;
const mockGet = runGetFamilyMembersForUser as jest.MockedFunction<
  typeof runGetFamilyMembersForUser
>;
const mockCreate = runCreateFamilyMemberForUser as jest.MockedFunction<
  typeof runCreateFamilyMemberForUser
>;

const mockMember: FamilyMember = {
  id: "fm1",
  userId: "u1",
  name: "Alice",
  role: "child",
  color: "#f59e0b",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/family-members", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/family-members");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns family members list", async () => {
    mockAuth.mockResolvedValue("u1");
    mockGet.mockResolvedValue([mockMember]);
    const req = new NextRequest("http://localhost/api/family-members");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(json[0].id).toBe("fm1");
  });
});

describe("POST /api/family-members", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/family-members", {
      method: "POST",
      body: JSON.stringify({ name: "Alice", role: "child", color: "#f59e0b" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when required fields missing", async () => {
    mockAuth.mockResolvedValue("u1");
    const req = new NextRequest("http://localhost/api/family-members", {
      method: "POST",
      body: JSON.stringify({ role: "child" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates family member and returns 200", async () => {
    mockAuth.mockResolvedValue("u1");
    mockCreate.mockResolvedValue(mockMember);
    const req = new NextRequest("http://localhost/api/family-members", {
      method: "POST",
      body: JSON.stringify({ name: "Alice", role: "child", color: "#f59e0b" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("fm1");
  });
});
