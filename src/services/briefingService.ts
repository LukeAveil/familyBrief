import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateWeeklyBriefing } from "@/lib/anthropic";
import { sendWeeklyBriefing } from "@/lib/email";
import { getUserProfile } from "@/services/userService";
import { getEventsForUser } from "@/services/eventService";
import type { WeeklyBriefing } from "@/types";
import type { Event } from "@/types";

type ActiveUser = {
  id: string;
  email: string;
  name: string;
  family_name: string;
};

/** Monday of the week for the given date (YYYY-MM-DD). */
export function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split("T")[0];
}

/** Last day of the week (Sunday) for range queries. */
function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart + "T12:00:00");
  d.setDate(d.getDate() + 6);
  return d.toISOString().split("T")[0];
}

/**
 * Ensure a briefing exists for the week containing eventDate.
 * If none exists, create one with generated content; if it exists, update content to include all events that week.
 */
export async function ensureBriefingForWeek(
  userId: string,
  eventDate: string
): Promise<void> {
  const weekStart = getWeekStart(eventDate);
  const weekEnd = getWeekEnd(weekStart);

  const profile = await getUserProfile(userId);
  if (!profile) return;

  const events = await getEventsForUser(userId, {
    start: weekStart,
    end: weekEnd,
  });

  const formattedEvents = events.map((e: Event) => ({
    title: e.title,
    date: e.date,
    time: e.time,
    familyMember: e.familyMember?.name ?? "Family",
    category: e.category,
    location: e.location,
  }));

  const content = await generateWeeklyBriefing(
    profile.familyName,
    profile.name,
    formattedEvents
  );

  const { data: existing } = await supabaseAdmin
    .from("weekly_briefings")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from("weekly_briefings")
      .update({ content })
      .eq("id", existing.id);
  } else {
    await supabaseAdmin.from("weekly_briefings").insert({
      user_id: userId,
      week_start: weekStart,
      content,
      sent_at: null,
    });
  }
}

/**
 * Refreshes weekly briefings for each distinct week touched by the given event dates
 * (one `ensureBriefingForWeek` per week, in date order).
 */
export async function syncBriefingsForDates(
  userId: string,
  dates: string[]
): Promise<void> {
  const weekSeen = new Set<string>();
  for (const date of dates) {
    const ws = getWeekStart(date);
    if (weekSeen.has(ws)) continue;
    weekSeen.add(ws);
    try {
      await ensureBriefingForWeek(userId, date);
    } catch (err) {
      console.warn("Briefing sync failed:", (err as Error)?.message);
    }
  }
}

type BriefingRow = {
  id: string;
  user_id: string;
  week_start: string;
  content: string;
  sent_at: string | null;
  created_at: string;
};

/**
 * Fetch all briefings for a user with events for each week.
 */
export async function getBriefingsForUser(
  userId: string
): Promise<WeeklyBriefing[]> {
  const { data: rows, error } = await supabaseAdmin
    .from("weekly_briefings")
    .select("id, user_id, week_start, content, sent_at, created_at")
    .eq("user_id", userId)
    .order("week_start", { ascending: false });

  if (error) throw new Error(error.message);
  if (!rows?.length) return [];

  const result: WeeklyBriefing[] = [];
  for (const row of rows as BriefingRow[]) {
    const weekEnd = getWeekEnd(row.week_start);
    const events = await getEventsForUser(userId, {
      start: row.week_start,
      end: weekEnd,
    });
    result.push({
      id: row.id,
      userId: row.user_id,
      weekStart: row.week_start,
      content: row.content,
      events,
      sentAt: row.sent_at ?? undefined,
      createdAt: row.created_at,
    });
  }
  return result;
}

export async function sendWeeklyBriefingsForActiveUsers() {
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, email, name, family_name")
    .eq("subscription_status", "active");

  if (!users) {
    return { sent: 0, total: 0 };
  }

  const results = await Promise.allSettled(
    users.map(async (user: ActiveUser) => {
      const weekStart = new Date();
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);

      const { data: events } = await supabaseAdmin
        .from("events")
        .select("*, family_members(name)")
        .eq("user_id", user.id)
        .gte("date", weekStart.toISOString().split("T")[0])
        .lte("date", weekEnd.toISOString().split("T")[0])
        .order("date");

      const formattedEvents = (events || []).map((e: any) => ({
        title: e.title,
        date: e.date,
        time: e.time,
        familyMember: e.family_members?.name || "Family",
        category: e.category,
        location: e.location,
      }));

      const briefing = await generateWeeklyBriefing(
        user.family_name,
        user.name,
        formattedEvents
      );
      const weekOf = weekStart.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
      });
      await sendWeeklyBriefing(user.email, user.name, briefing, weekOf);
      await supabaseAdmin.from("weekly_briefings").insert({
        user_id: user.id,
        week_start: weekStart.toISOString(),
        content: briefing,
        sent_at: new Date().toISOString(),
      });
    })
  );

  return {
    sent: results.filter((r) => r.status === "fulfilled").length,
    total: users.length,
  };
}

