export interface User {
  id: string;
  email: string;
  name: string;
  familyName: string;
  createdAt: string; // ISO timestamp
}

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  role: 'parent' | 'child';
  age?: number;
  color: string;
}

export interface Event {
  id: string;
  userId: string;
  familyMemberId: string | null;
  familyMember?: {
    id: string;
    name: string;
    color: string;
  };
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string;
  location?: string;
  category: 'school' | 'activity' | 'medical' | 'social' | 'other';
  source: 'manual' | 'email' | 'image';
  rawEmailId?: string;
  createdAt: string; // ISO timestamp
}

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
