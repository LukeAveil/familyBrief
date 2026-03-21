/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { getAuthedUserIdFromRequest } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

jest.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    auth: {
      getUser: jest.fn(),
    },
  },
}));

const mockGetUser = supabaseAdmin.auth.getUser as jest.MockedFunction<
  typeof supabaseAdmin.auth.getUser
>;

describe("getAuthedUserIdFromRequest", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when Authorization header is missing", async () => {
    const req = new NextRequest("http://localhost/api/test");
    await expect(getAuthedUserIdFromRequest(req)).resolves.toBeNull();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("returns null when Bearer token is missing", async () => {
    const req = new NextRequest("http://localhost/api/test", {
      headers: { authorization: "Basic xyz" },
    });
    await expect(getAuthedUserIdFromRequest(req)).resolves.toBeNull();
  });

  it("returns user id when Supabase validates the JWT", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-uuid-1" } },
      error: null,
    } as Awaited<ReturnType<typeof mockGetUser>>);

    const req = new NextRequest("http://localhost/api/test", {
      headers: { authorization: "Bearer valid.jwt.token" },
    });

    await expect(getAuthedUserIdFromRequest(req)).resolves.toBe("user-uuid-1");
    expect(mockGetUser).toHaveBeenCalledWith("valid.jwt.token");
  });

  it("returns null when Supabase reports an error", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "invalid" },
    } as Awaited<ReturnType<typeof mockGetUser>>);

    const req = new NextRequest("http://localhost/api/test", {
      headers: { authorization: "Bearer bad" },
    });

    await expect(getAuthedUserIdFromRequest(req)).resolves.toBeNull();
  });

  it("returns null when getUser throws", async () => {
    mockGetUser.mockRejectedValue(new Error("network"));

    const req = new NextRequest("http://localhost/api/test", {
      headers: { authorization: "Bearer x" },
    });

    await expect(getAuthedUserIdFromRequest(req)).resolves.toBeNull();
  });
});
