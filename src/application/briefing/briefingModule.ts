import { generateBriefingForUserWeek } from "@/application/briefing/briefingUseCases";
import { runGetFamilyMembersForUser } from "@/application/family/familyModule";
import { runGetEventsForUser } from "@/application/events/eventModule";
import { supabaseBriefingRepository } from "@/infrastructure/briefing/supabaseBriefingRepository";
import { sendWeeklyBriefingEmail } from "@/lib/email";
import { toIsoDateString } from "@/lib/briefing/week";

export function runGenerateBriefingForUserWeek(userId: string) {
  return generateBriefingForUserWeek(userId, {
    repo: supabaseBriefingRepository,
    email: sendWeeklyBriefingEmail,
    getEvents: async (uid, range) =>
      runGetEventsForUser(uid, {
        start: toIsoDateString(range.start),
        end: toIsoDateString(range.end),
      }),
    getFamilyMembers: runGetFamilyMembersForUser,
  });
}
