import type {
  ActiveUsersQueryPort,
  BriefingGeneratorPort,
  BriefingRepository,
  EventQueryPort,
  UserQueryPort,
  WeeklyBriefingEmailPort,
} from "@/application/briefing/briefingPorts";
import { generateWeeklyBriefing } from "@/lib/anthropic";
import {
  formatWeekOfLabel,
  getToday,
  getWeekEnd,
  getWeekStart,
  parseIsoDate,
  toIsoDateString,
} from "@/lib/briefing/week";
import type { BriefingListItem, Event } from "@/types";
import type { Sentiment } from "@/domain/briefing";

export type GenerateBriefingDeps = {
  repo: BriefingRepository;
  email: WeeklyBriefingEmailPort;
  getEvents: EventQueryPort;
  getUser: UserQueryPort;
  generate?: BriefingGeneratorPort;
};

const defaultGenerate: BriefingGeneratorPort = async (input) =>
  generateWeeklyBriefing(input.familyName, input.parentName, input.events);

function mapEventsForGenerator(events: Event[]) {
  return events.map((e) => ({
    title: e.title,
    date: e.date,
    time: e.time,
    familyMember: e.familyMember?.name ?? "Family",
    category: e.category,
    location: e.location,
  }));
}

/**
 * Generates AI content for the calendar week containing today, upserts the row,
 * and sends email. Email failure does not roll back the save.
 */
export async function generateBriefingForUserWeek(
  userId: string,
  deps: GenerateBriefingDeps
): Promise<{
  briefing: {
    id: string;
    content: string;
    weekStart: Date;
    sentAt: Date;
  };
  emailSent: boolean;
}> {
  const user = await deps.getUser(userId);
  if (!user) {
    throw new Error("User profile not found");
  }

  const today = getToday();
  const weekStart = getWeekStart(today);
  const weekEnd = getWeekEnd(weekStart);

  const events = await deps.getEvents(userId, { start: weekStart, end: weekEnd });
  const formatted = mapEventsForGenerator(events);

  const runGenerate = deps.generate ?? defaultGenerate;
  const content = await runGenerate({
    familyName: user.familyName,
    parentName: user.name,
    events: formatted,
  });

  const sentAt = new Date();
  const saved = await deps.repo.upsertForWeek({
    userId,
    weekStart,
    content,
    sentAt,
  });

  const weekOf = formatWeekOfLabel(weekStart);
  const emailResult = await deps.email({
    toEmail: user.email,
    toName: user.name,
    familyName: user.familyName,
    briefingContent: content,
    weekOf,
    briefingId: saved.id,
  });

  const sentAtOut = saved.sentAt ?? sentAt;

  return {
    briefing: {
      id: saved.id,
      content: saved.content,
      weekStart: saved.weekStart,
      sentAt: sentAtOut,
    },
    emailSent: emailResult.ok,
  };
}

export async function listBriefingItemsForUser(
  userId: string,
  repo: BriefingRepository
): Promise<BriefingListItem[]> {
  const rows = await repo.listRowsForUser(userId);
  return rows.map((r) => ({
    id: r.id,
    weekStart: r.weekStart,
    content: r.content,
    sentAt: r.sentAt ?? undefined,
    createdAt: r.createdAt,
  }));
}

export type FeedbackDeps = { repo: BriefingRepository };

export class BriefingNotFoundError extends Error {
  constructor() {
    super("Briefing not found");
    this.name = "BriefingNotFoundError";
  }
}

export async function recordBriefingFeedback(
  userId: string,
  briefingId: string,
  sentiment: Sentiment,
  deps: FeedbackDeps
): Promise<void> {
  const row = await deps.repo.getByIdForUser(briefingId, userId);
  if (!row) {
    throw new BriefingNotFoundError();
  }
  await deps.repo.recordFeedback(briefingId, userId, sentiment);
}

export type EnsureBriefingDeps = {
  repo: BriefingRepository;
  getEvents: EventQueryPort;
  getUser: UserQueryPort;
  generate?: BriefingGeneratorPort;
};

export async function ensureBriefingForWeek(
  userId: string,
  eventDate: string,
  deps: EnsureBriefingDeps
): Promise<void> {
  const user = await deps.getUser(userId);
  if (!user) return;

  const weekStart = getWeekStart(parseIsoDate(eventDate));
  const weekEnd = getWeekEnd(weekStart);

  const events = await deps.getEvents(userId, { start: weekStart, end: weekEnd });
  const formatted = mapEventsForGenerator(events);

  const runGenerate = deps.generate ?? defaultGenerate;
  const content = await runGenerate({
    familyName: user.familyName,
    parentName: user.name,
    events: formatted,
  });

  await deps.repo.upsertForWeek({ userId, weekStart, content });
}

export async function syncBriefingsForDates(
  userId: string,
  dates: string[],
  deps: EnsureBriefingDeps
): Promise<void> {
  const weekSeen = new Set<string>();
  for (const date of dates) {
    const ws = toIsoDateString(getWeekStart(parseIsoDate(date)));
    if (weekSeen.has(ws)) continue;
    weekSeen.add(ws);
    try {
      await ensureBriefingForWeek(userId, date, deps);
    } catch (err) {
      console.warn("Briefing sync failed:", (err as Error)?.message);
    }
  }
}

export type SendWeeklyBriefingsDeps = GenerateBriefingDeps & {
  getActiveUsers: ActiveUsersQueryPort;
};

export async function sendWeeklyBriefingsForActiveUsers(
  deps: SendWeeklyBriefingsDeps
): Promise<{ sent: number; total: number }> {
  const users = await deps.getActiveUsers();
  if (!users.length) return { sent: 0, total: 0 };

  const results = await Promise.allSettled(
    users.map((user) =>
      generateBriefingForUserWeek(user.id, {
        ...deps,
        getUser: async () => ({
          name: user.name,
          familyName: user.familyName,
          email: user.email,
        }),
      })
    )
  );

  return {
    sent: results.filter((r) => r.status === "fulfilled").length,
    total: users.length,
  };
}
