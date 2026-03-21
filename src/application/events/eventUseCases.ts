import type {
  CreateManualEventInput,
  EventDateRangeFilter,
  EventRepository,
} from "@/application/events/eventPorts";
import type { CalendarEventInsertRow } from "@/domain/calendarImport";
import type { Event } from "@/types";

export async function getEventsForUser(
  userId: string,
  range: EventDateRangeFilter | undefined,
  repo: EventRepository
): Promise<Event[]> {
  return repo.listForUser(userId, range);
}

export async function getEventForUser(
  userId: string,
  id: string,
  repo: EventRepository
): Promise<Event | null> {
  return repo.getByIdForUser(userId, id);
}

export async function createManualEventForUser(
  userId: string,
  payload: CreateManualEventInput,
  repo: EventRepository
): Promise<Event> {
  return repo.createManualForUser(userId, payload);
}

export async function deleteEventForUser(
  userId: string,
  id: string,
  repo: EventRepository
): Promise<void> {
  return repo.deleteForUser(userId, id);
}

export async function insertExtractedEventsForUser(
  userId: string,
  rows: CalendarEventInsertRow[],
  repo: EventRepository
): Promise<Event[]> {
  return repo.insertExtractedEventsForUser(userId, rows);
}
