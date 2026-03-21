import {
  createManualEventForUser,
  deleteEventForUser,
  getEventForUser,
  getEventsForUser,
  insertExtractedEventsForUser,
} from "@/application/events/eventUseCases";
import { supabaseEventRepository } from "@/infrastructure/events/supabaseEventRepository";
import type { CreateManualEventInput } from "@/application/events/eventPorts";
import type { CalendarEventInsertRow } from "@/domain/calendarImport";
import type { Event } from "@/types";

export function runGetEventsForUser(
  userId: string,
  range?: { start?: string | null; end?: string | null }
): Promise<Event[]> {
  return getEventsForUser(userId, range, supabaseEventRepository);
}

export function runGetEventForUser(
  userId: string,
  id: string
): Promise<Event | null> {
  return getEventForUser(userId, id, supabaseEventRepository);
}

export function runCreateManualEventForUser(
  userId: string,
  payload: CreateManualEventInput
): Promise<Event> {
  return createManualEventForUser(
    userId,
    payload,
    supabaseEventRepository
  );
}

export function runDeleteEventForUser(
  userId: string,
  id: string
): Promise<void> {
  return deleteEventForUser(userId, id, supabaseEventRepository);
}

export function runInsertExtractedEventsForUser(
  userId: string,
  rows: CalendarEventInsertRow[]
): Promise<Event[]> {
  return insertExtractedEventsForUser(userId, rows, supabaseEventRepository);
}
