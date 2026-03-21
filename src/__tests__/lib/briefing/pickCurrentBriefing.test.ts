import { pickCurrentBriefing } from "@/lib/briefing/pickCurrentBriefing";
import { parseIsoDate } from "@/lib/briefing/week";

describe("pickCurrentBriefing", () => {
  const list = [
    { id: "a", weekStart: parseIsoDate("2026-03-16"), content: "old" },
    { id: "b", weekStart: parseIsoDate("2026-03-09"), content: "older" },
  ];

  it("returns null for empty list", () => {
    expect(pickCurrentBriefing([], parseIsoDate("2026-03-18"))).toBeNull();
  });

  it("prefers the briefing whose week contains today", () => {
    const picked = pickCurrentBriefing(list, parseIsoDate("2026-03-18"));
    expect(picked?.id).toBe("a");
  });

  it("falls back to first item when no week matches", () => {
    const picked = pickCurrentBriefing(list, parseIsoDate("2025-01-01"));
    expect(picked?.id).toBe("a");
  });
});
