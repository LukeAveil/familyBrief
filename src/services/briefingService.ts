import { generateWeeklyBriefing } from "@/lib/anthropic";
import { sendWeeklyBriefingEmail } from "@/lib/email";
import {
  formatWeekOfLabel,
  getToday,
  getWeekEnd,
  getWeekStart,
  parseIsoDate,
  toIsoDateString,
} from "@/lib/briefing/week";
import { supabaseBriefingRepository } from "@/infrastructure/briefing/supabaseBriefingRepository";
import { runGetEventsForUser } from "@/application/events/eventModule";
import {
  runGetActiveSubscribedUsers,
  runGetUserProfile,
} from "@/application/user/userModule";
import type { WeeklyBriefing } from "@/types";
import type { Event } from "@/types";

export {
  getWeekStart,
  getWeekEnd,
  parseIsoDate,
  toIsoDateString,
} from "@/lib/briefing/week";

type ActiveUser = {
  id: string;
  email: string;
  name: string;
  family_name: string;
};

/**
 * Ensure a briefing exists for the week containing eventDate.
 * If none exists, create one with generated content; if it exists, update content to include all events that week.
 */
export async function ensureBriefingForWeek(
  userId: string,
  eventDate: string
): Promise<void> {
  const weekStart = getWeekStart(parseIsoDate(eventDate));
  const weekEnd = getWeekEnd(weekStart);

  const profile = await runGetUserProfile(userId);
  if (!profile) return;

  const events = await runGetEventsForUser(userId, {
    start: toIsoDateString(weekStart),
    end: toIsoDateString(weekEnd),
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

  await supabaseBriefingRepository.upsertForWeek({
    userId,
    weekStart,
    content,
  });
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
    const ws = toIsoDateString(getWeekStart(parseIsoDate(date)));
    if (weekSeen.has(ws)) continue;
    weekSeen.add(ws);
    try {
      await ensureBriefingForWeek(userId, date);
    } catch (err) {
      console.warn("Briefing sync failed:", (err as Error)?.message);
    }
  }
}

/**
 * Fetch all briefings for a user with events for each week.
 */
export async function getBriefingsForUser(
  userId: string
): Promise<WeeklyBriefing[]> {
  const rows = await supabaseBriefingRepository.listRowsForUser(userId);
  if (!rows.length) return [];

  const result: WeeklyBriefing[] = [];
  for (const row of rows) {
    const weekEnd = getWeekEnd(row.weekStart);
    const events = await runGetEventsForUser(userId, {
      start: toIsoDateString(row.weekStart),
      end: toIsoDateString(weekEnd),
    });
    result.push({
      id: row.id,
      userId,
      weekStart: row.weekStart,
      content: row.content,
      events,
      sentAt: row.sentAt ?? undefined,
      createdAt: row.createdAt,
    });
  }
  return result;
}

export async function sendWeeklyBriefingsForActiveUsers() {
  const users = await runGetActiveSubscribedUsers();

  if (!users.length) {
    return { sent: 0, total: 0 };
  }

  const results = await Promise.allSettled(
    users.map(async (user) => {
      const weekStart = getWeekStart(getToday());
      const weekEnd = getWeekEnd(weekStart);

      const events = await runGetEventsForUser(user.id, {
        start: toIsoDateString(weekStart),
        end: toIsoDateString(weekEnd),
      });

      const formattedEvents = events.map((e: Event) => ({
        title: e.title,
        date: e.date,
        time: e.time,
        familyMember: e.familyMember?.name ?? "Family",
        category: e.category,
        location: e.location,
      }));

      const briefing = await generateWeeklyBriefing(
        user.familyName,
        user.name,
        formattedEvents
      );

      const saved = await supabaseBriefingRepository.upsertForWeek({
        userId: user.id,
        weekStart,
        content: briefing,
        sentAt: new Date(),
      });

      const weekOf = formatWeekOfLabel(weekStart);
      await sendWeeklyBriefingEmail({
        toEmail: user.email,
        toName: user.name,
        familyName: user.familyName,
        briefingContent: briefing,
        weekOf,
        briefingId: saved.id,
      });
    })
  );

  return {
    sent: results.filter((r) => r.status === "fulfilled").length,
    total: users.length,
  };
}
