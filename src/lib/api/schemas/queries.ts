import { z } from "zod";

export const eventsGetQuerySchema = z.object({
  start: z.string().nullable(),
  end: z.string().nullable(),
});

export const eventsDeleteQuerySchema = z.object({
  id: z.string().min(1),
});
