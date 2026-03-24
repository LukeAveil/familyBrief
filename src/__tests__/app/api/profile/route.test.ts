/**
 * @jest-environment node
 */
import { GET, POST } from "@/app/api/profile/route";
import { NextRequest } from "next/server";
import { getAuthedUserFromRequest } from "@/lib/apiAuth";
import {
  runGetUserProfile,
  runUpsertUserProfile,
} from "@/application/user/userModule";

jest.mock("@/lib/apiAuth", () => ({
  getAuthedUserFromRequest: jest.fn(),
}));
jest.mock("@/application/user/userModule", () => ({
  runGetUserProfile: jest.fn(),
  runUpsertUserProfile: jest.fn(),
}));

const mockAuth = getAuthedUserFromRequest as jest.MockedFunction<
  typeof getAuthedUserFromRequest
>;
const mockGet = runGetUserProfile as jest.MockedFunction<
  typeof runGetUserProfile
>;
const mockUpsert = runUpsertUserProfile as jest.MockedFunction<
  typeof runUpsertUserProfile
>;

const mockUser = { id: "u1", email: "alice@example.com" };
const mockProfile = {
  id: "u1",
  email: "alice@example.com",
  name: "Alice",
  familyName: "Smith",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/profile", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/profile");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns profile when found", async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockGet.mockResolvedValue(mockProfile);
    const req = new NextRequest("http://localhost/api/profile");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.name).toBe("Alice");
  });

  it("returns null profile when not yet set up", async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockGet.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/profile");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});

describe("POST /api/profile", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/profile", {
      method: "POST",
      body: JSON.stringify({ name: "Alice", familyName: "Smith" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when required fields missing", async () => {
    mockAuth.mockResolvedValue(mockUser);
    const req = new NextRequest("http://localhost/api/profile", {
      method: "POST",
      body: JSON.stringify({ name: "Alice" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("upserts profile and returns 200", async () => {
    mockAuth.mockResolvedValue(mockUser);
    mockUpsert.mockResolvedValue(mockProfile);
    const req = new NextRequest("http://localhost/api/profile", {
      method: "POST",
      body: JSON.stringify({ name: "Alice", familyName: "Smith" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.familyName).toBe("Smith");
  });
});
