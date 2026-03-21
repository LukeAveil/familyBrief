import { z } from "zod";
import {
  eventCategorySchema,
  eventSourceSchema,
  familyMemberRoleSchema,
} from "@/lib/api/schemas/primitives";

const eventFamilyMemberNested = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
});

/** Event as returned by JSON (ISO strings for timestamps) */
export const eventResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  familyMemberId: z.string().nullable(),
  familyMember: eventFamilyMemberNested.optional(),
  title: z.string(),
  description: z.string().optional(),
  date: z.string(),
  time: z.string().optional(),
  location: z.string().optional(),
  category: eventCategorySchema,
  source: eventSourceSchema,
  rawEmailId: z.string().optional(),
  createdAt: z.string(),
});

export const eventListResponseSchema = z.array(eventResponseSchema);

export const familyMemberResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  role: familyMemberRoleSchema,
  age: z.number().optional(),
  color: z.string(),
});

export const familyMemberListResponseSchema = z.array(familyMemberResponseSchema);

export const userProfileResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  familyName: z.string(),
});

export const profileGetResponseSchema = z.union([
  userProfileResponseSchema,
  z.null(),
]);

/** Briefing list row over the wire (dates serialized to ISO strings) */
export const briefingListItemWireSchema = z.object({
  id: z.string(),
  weekStart: z.string(),
  content: z.string(),
  sentAt: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const briefingListResponseSchema = z.array(briefingListItemWireSchema);

export const briefingGenerateResponseSchema = z.object({
  success: z.literal(true),
  briefing: z.object({
    id: z.string(),
    content: z.string(),
    weekStart: z.string(),
    sentAt: z.string(),
  }),
  emailSent: z.boolean(),
});

export const parseImageSuccessResponseSchema = z.object({
  events: z.array(eventResponseSchema),
  count: z.number().int().nonnegative(),
});

export const parseEmailSuccessResponseSchema = z.object({
  success: z.literal(true),
  eventsCreated: z.number().int().nonnegative(),
});

export const weeklyBriefingCronResponseSchema = z.object({
  sent: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export const logoutResponseSchema = z.union([
  z.object({ success: z.literal(true) }),
  z.object({ success: z.literal(false), error: z.string() }),
]);

export const deleteEventSuccessResponseSchema = z.object({
  success: z.literal(true),
});

export const feedbackOkResponseSchema = z.object({ ok: z.literal(true) });

export const errorResponseSchema = z.object({ error: z.string() });
