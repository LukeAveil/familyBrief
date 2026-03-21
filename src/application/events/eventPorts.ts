import type { Event } from "@/types";

export type EventDateRangeFilter = {
  start?: string | null;
  end?: string | null;
};

export type CreateManualEventInput = {
  title: string;
  date: string;
  time?: string;
  location?: string;
  category: Event["category"];
  familyMemberId?: string | null;
  description?: string;
};

export type EventRepository = {
  listForUser: (
    userId: string,
    range?: EventDateRangeFilter
  ) => Promise<Event[]>;
  getByIdForUser: (userId: string, id: string) => Promise<Event | null>;
  createManualForUser: (
    userId: string,
    payload: CreateManualEventInput
  ) => Promise<Event>;
  deleteForUser: (userId: string, id: string) => Promise<void>;
};
