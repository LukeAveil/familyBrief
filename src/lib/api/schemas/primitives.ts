import { z } from "zod";

/** Calendar date YYYY-MM-DD */
export const isoDateYmd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const eventCategorySchema = z.enum([
  "school",
  "activity",
  "medical",
  "social",
  "other",
]);

export const eventSourceSchema = z.enum(["manual", "email", "image"]);

export const familyMemberRoleSchema = z.enum(["parent", "child"]);

export const sentimentSchema = z.enum(["up", "down"]);
