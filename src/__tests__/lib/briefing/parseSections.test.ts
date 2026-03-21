import { parseBriefingSections } from "@/lib/briefing/parseSections";

describe("parseBriefingSections", () => {
  it("returns empty array for empty input", () => {
    expect(parseBriefingSections("")).toEqual([]);
    expect(parseBriefingSections("   ")).toEqual([]);
  });

  it("parses a single block without weekday as one section", () => {
    const s = parseBriefingSections("Hello there\nSecond line");
    expect(s).toHaveLength(1);
    expect(s[0].title).toBe("Briefing");
    expect(s[0].body).toContain("Hello there");
  });

  it("splits on weekday headings", () => {
    const text = `Good morning!

Monday
Soccer practice at 4pm.

Tuesday
Quiet day at home.`;

    const s = parseBriefingSections(text);
    expect(s.length).toBeGreaterThanOrEqual(2);
    const titles = s.map((x) => x.title);
    expect(titles.some((t) => t.toLowerCase().includes("monday"))).toBe(true);
    expect(titles.some((t) => t.toLowerCase().includes("tuesday"))).toBe(true);
  });
});
