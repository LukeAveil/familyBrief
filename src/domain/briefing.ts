import type { Event } from "@/domain/event";

export const SENTIMENTS = ["up", "down"] as const;

export type Sentiment = (typeof SENTIMENTS)[number];

export interface WeeklyBriefing {
  id: string;
  userId: string;
  weekStart: Date;
  content: string;
  events: Event[];
  sentAt?: Date;
  createdAt: Date;
}

/** Slim list row (no nested events) for dashboard sidebar + API list. */
export interface BriefingListItem {
  id: string;
  weekStart: Date;
  content: string;
  sentAt?: Date;
  createdAt: Date;
}

export interface ParsedEmail {
  id: string;
  userId: string;
  fromAddress: string;
  subject: string;
  body: string;
  receivedAt: string;
  processed: boolean;
  extractedEvents: Event[];
}
