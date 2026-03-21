import { z } from "zod";
import {
  eventCategorySchema,
  familyMemberRoleSchema,
  sentimentSchema,
  isoDateYmd,
} from "@/lib/api/schemas/primitives";

export const createEventPostBodySchema = z.object({
  title: z.string().min(1),
  date: isoDateYmd,
  time: z.string().optional(),
  location: z.string().optional(),
  category: eventCategorySchema,
  family_member_id: z.string().nullable().optional(),
  description: z.string().optional(),
});

export const createFamilyMemberPostBodySchema = z.object({
  name: z.string().min(1),
  role: familyMemberRoleSchema,
  age: z.number().int().min(0).max(120).optional(),
  color: z.string().min(1),
});

export const profilePostBodySchema = z.object({
  name: z.string().min(1),
  familyName: z.string().min(1),
});

export const feedbackPostBodySchema = z.object({
  briefingId: z.string().min(1),
  sentiment: sentimentSchema,
});

/** Inbound email webhook / Resend payload */
export const parseEmailPostBodySchema = z.object({
  to: z.string().default(""),
  from: z.string().default(""),
  subject: z.string().default(""),
  text: z.string().optional(),
  html: z.string().optional(),
});
