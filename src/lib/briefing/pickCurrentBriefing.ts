import moment from "moment";
import { getWeekStart } from "@/lib/briefing/week";

/** Prefer this calendar week's briefing; otherwise the first item (caller should pass desc-sorted list). */
export function pickCurrentBriefing<T extends { weekStart: Date }>(
  briefings: T[],
  today: Date
): T | null {
  if (briefings.length === 0) return null;
  const ws = getWeekStart(today);
  const thisWeek = briefings.find((b) => moment(b.weekStart).isSame(ws, "day"));
  return thisWeek ?? briefings[0] ?? null;
}
