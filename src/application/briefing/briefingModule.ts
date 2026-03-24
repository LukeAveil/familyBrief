import {
  generateBriefingForUserWeek,
  listBriefingItemsForUser,
  recordBriefingFeedback,
  sendWeeklyBriefingsForActiveUsers,
  syncBriefingsForDates,
} from "@/application/briefing/briefingUseCases";
import type { Sentiment } from "@/domain/briefing";
import type { UpsertedBriefing } from "@/application/briefing/briefingPorts";
import { runGetEventsForUser } from "@/application/events/eventModule";
import {
  runGetActiveSubscribedUsers,
  runGetUserProfile,
} from "@/application/user/userModule";
import { supabaseBriefingRepository } from "@/infrastructure/briefing/supabaseBriefingRepository";
import { sendWeeklyBriefingEmail } from "@/lib/email";
import { toIsoDateString } from "@/lib/briefing/week";

const baseDeps = {
  repo: supabaseBriefingRepository,
  getEvents: async (uid: string, range: { start: Date; end: Date }) =>
    runGetEventsForUser(uid, {
      start: toIsoDateString(range.start),
      end: toIsoDateString(range.end),
    }),
  getUser: async (uid: string) => {
    const profile = await runGetUserProfile(uid);
    if (!profile) return null;
    return {
      name: profile.name,
      familyName: profile.familyName,
      email: profile.email,
    };
  },
};

export function runListBriefingItemsForUser(userId: string) {
  return listBriefingItemsForUser(userId, supabaseBriefingRepository);
}

export function runRecordBriefingFeedback(
  userId: string,
  briefingId: string,
  sentiment: Sentiment
): Promise<void> {
  return recordBriefingFeedback(userId, briefingId, sentiment, {
    repo: supabaseBriefingRepository,
  });
}

export function runUpsertBriefingForWeek(params: {
  userId: string;
  weekStart: Date;
  content: string;
  sentAt?: Date | null;
}): Promise<UpsertedBriefing> {
  return supabaseBriefingRepository.upsertForWeek(params);
}

export function runListBriefingRowsForUser(userId: string) {
  return supabaseBriefingRepository.listRowsForUser(userId);
}

export function runGenerateBriefingForUserWeek(userId: string) {
  return generateBriefingForUserWeek(userId, {
    ...baseDeps,
    email: sendWeeklyBriefingEmail,
  });
}

export function runSyncBriefingsForDates(userId: string, dates: string[]) {
  return syncBriefingsForDates(userId, dates, baseDeps);
}

export function runSendWeeklyBriefingsForActiveUsers() {
  return sendWeeklyBriefingsForActiveUsers({
    ...baseDeps,
    email: sendWeeklyBriefingEmail,
    getActiveUsers: runGetActiveSubscribedUsers,
  });
}
