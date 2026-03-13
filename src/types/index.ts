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
  source: 'manual' | 'email';
  rawEmailId?: string;
  createdAt: string; // ISO timestamp
}

export interface WeeklyBriefing {
  id: string;
  userId: string;
  weekStart: string; // ISO date
  content: string;
  events: Event[];
  sentAt?: string;
  createdAt: string;
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
