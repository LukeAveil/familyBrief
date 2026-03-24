import { EVENT_CATEGORIES, EVENT_SOURCES } from "@/domain/event";
import type { EventCategory, EventSource } from "@/domain/event";
import { FAMILY_MEMBER_ROLES } from "@/domain/familyMember";
import type { FamilyMemberRole } from "@/domain/familyMember";
import { SENTIMENTS } from "@/domain/briefing";
import type { Sentiment } from "@/domain/briefing";
import { z } from "zod";

/** Calendar date YYYY-MM-DD */
export const isoDateYmd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const eventCategorySchema = z.enum(
  EVENT_CATEGORIES as unknown as [EventCategory, ...EventCategory[]]
);

export const eventSourceSchema = z.enum(
  EVENT_SOURCES as unknown as [EventSource, ...EventSource[]]
);

export const familyMemberRoleSchema = z.enum(
  FAMILY_MEMBER_ROLES as unknown as [
    FamilyMemberRole,
    ...FamilyMemberRole[],
  ]
);

export const sentimentSchema = z.enum(
  SENTIMENTS as unknown as [Sentiment, ...Sentiment[]]
);
