import { generateBriefingForUserWeek } from "@/application/briefing/briefingUseCases";
import { supabaseBriefingRepository } from "@/infrastructure/briefing/supabaseBriefingRepository";
import { sendWeeklyBriefingEmail } from "@/lib/email";
import { toIsoDateString } from "@/lib/briefing/week";
import { getEventsForUser } from "@/services/eventService";

export function runGenerateBriefingForUserWeek(userId: string) {
  return generateBriefingForUserWeek(userId, {
    repo: supabaseBriefingRepository,
    email: sendWeeklyBriefingEmail,
    getEvents: async (uid, range) =>
      getEventsForUser(uid, {
        start: toIsoDateString(range.start),
        end: toIsoDateString(range.end),
      }),
  });
}
