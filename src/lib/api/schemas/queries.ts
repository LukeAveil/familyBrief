import { z } from "zod";
import { isoDateYmd } from "@/lib/api/schemas/primitives";

export const eventsGetQuerySchema = z.object({
  start: isoDateYmd.nullable(),
  end: isoDateYmd.nullable(),
});

export const eventsDeleteQuerySchema = z.object({
  id: z.string().min(1),
});
