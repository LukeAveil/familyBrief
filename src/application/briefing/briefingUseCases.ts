import type {
  BriefingGeneratorPort,
  BriefingRepository,
  EventQueryPort,
  WeeklyBriefingEmailPort,
} from "@/application/briefing/briefingPorts";
import { generateWeeklyBriefing } from "@/lib/anthropic";
import {
  formatWeekOfLabel,
  getToday,
  getWeekEnd,
  getWeekStart,
} from "@/lib/briefing/week";
import { getUserProfile } from "@/services/userService";
import type { BriefingListItem, Event, FamilyMember } from "@/types";

export type GenerateBriefingDeps = {
  repo: BriefingRepository;
  email: WeeklyBriefingEmailPort;
  getEvents: EventQueryPort;
  getFamilyMembers: (userId: string) => Promise<FamilyMember[]>;
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
  const profile = await getUserProfile(userId);
  if (!profile) {
    throw new Error("User profile not found");
  }

  await deps.getFamilyMembers(userId);

  const today = getToday();
  const weekStart = getWeekStart(today);
  const weekEnd = getWeekEnd(weekStart);

  const events = await deps.getEvents(userId, { start: weekStart, end: weekEnd });
  const formatted = mapEventsForGenerator(events);

  const runGenerate = deps.generate ?? defaultGenerate;
  const content = await runGenerate({
    familyName: profile.familyName,
    parentName: profile.name,
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
    toEmail: profile.email,
    toName: profile.name,
    familyName: profile.familyName,
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
  sentiment: "up" | "down",
  deps: FeedbackDeps
): Promise<void> {
  const row = await deps.repo.getByIdForUser(briefingId, userId);
  if (!row) {
    throw new BriefingNotFoundError();
  }
  console.info("[briefing feedback]", {
    briefingId,
    userId,
    sentiment,
  });
}
