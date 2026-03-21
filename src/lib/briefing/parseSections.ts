export type BriefingSection = { title: string; body: string };

const DAY_PATTERN =
  /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i;

/**
 * Split plain-text briefing into sections. Lines starting with a weekday name
 * start a new section (matches typical Claude Mon–Sun output).
 */
export function parseBriefingSections(text: string): BriefingSection[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const rawLines = trimmed.split(/\r?\n/);
  const sections: BriefingSection[] = [];
  let buf: string[] = [];
  let currentTitle = "";

  const flush = () => {
    const body = buf.join("\n").trim();
    if (body || currentTitle) {
      sections.push({
        title: currentTitle || "Briefing",
        body: body || "",
      });
    }
    buf = [];
  };

  for (const line of rawLines) {
    const dayMatch = line.match(DAY_PATTERN);
    if (dayMatch) {
      flush();
      currentTitle =
        dayMatch[1].charAt(0).toUpperCase() +
        dayMatch[1].slice(1).toLowerCase();
      const rest = line.slice(dayMatch[0].length).trim();
      buf = rest ? [rest] : [];
    } else {
      buf.push(line);
    }
  }
  flush();

  return sections;
}
