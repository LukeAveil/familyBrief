import { generateBriefingForUserWeek } from "@/application/briefing/briefingUseCases";
import { runGetFamilyMembersForUser } from "@/application/family/familyModule";
import { runGetEventsForUser } from "@/application/events/eventModule";
import { runGetUserProfile } from "@/application/user/userModule";
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
    getUser: async (uid) => {
      const profile = await runGetUserProfile(uid);
      if (!profile) return null;
      return {
        name: profile.name,
        familyName: profile.familyName,
        email: profile.email,
      };
    },
    getFamilyMembers: runGetFamilyMembersForUser,
  });
}
