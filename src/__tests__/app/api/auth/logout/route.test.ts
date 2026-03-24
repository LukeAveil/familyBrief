/**
 * @jest-environment node
 */
import { POST } from "@/app/api/auth/logout/route";
import { signOut } from "@/lib/auth";

jest.mock("@/lib/auth", () => ({
  signOut: jest.fn(),
}));

const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/auth/logout", () => {
  it("returns success when signOut succeeds", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    const res = await POST();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("returns 500 when signOut fails", async () => {
    mockSignOut.mockResolvedValue({ error: "Session expired" });
    const res = await POST();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe("Session expired");
  });
});
