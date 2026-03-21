import {
  formatWeekOfLabel,
  getWeekEnd,
  getWeekStart,
  parseIsoDate,
  toIsoDateString,
} from "@/lib/briefing/week";

describe("getWeekStart / getWeekEnd", () => {
  it("returns Monday 2026-03-16 for Wednesday 2026-03-18", () => {
    expect(
      toIsoDateString(getWeekStart(parseIsoDate("2026-03-18")))
    ).toBe("2026-03-16");
  });

  it("returns Monday of the same week when date is Sunday", () => {
    expect(
      toIsoDateString(getWeekStart(parseIsoDate("2026-03-22")))
    ).toBe("2026-03-16");
  });

  it("getWeekEnd is Sunday six days after Monday week start", () => {
    const mon = parseIsoDate("2026-03-16");
    expect(toIsoDateString(getWeekEnd(mon))).toBe("2026-03-22");
  });

  it("formatWeekOfLabel formats Monday", () => {
    expect(formatWeekOfLabel(parseIsoDate("2026-03-16"))).toMatch(/16/);
    expect(formatWeekOfLabel(parseIsoDate("2026-03-16"))).toMatch(/March/);
  });
});
