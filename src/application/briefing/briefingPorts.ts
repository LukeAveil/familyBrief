import type { Event } from "@/types";
import type { Sentiment } from "@/domain/briefing";

export type BriefingGeneratorInput = {
  familyName: string;
  parentName: string;
  events: {
    title: string;
    date: string;
    time?: string;
    familyMember: string;
    category: string;
    location?: string;
  }[];
};

export type BriefingGeneratorPort = (
  input: BriefingGeneratorInput
) => Promise<string>;

export type WeeklyBriefingEmailPayload = {
  toEmail: string;
  toName: string;
  familyName: string;
  briefingContent: string;
  weekOf: string;
  briefingId: string;
};

export type WeeklyBriefingEmailPort = (
  payload: WeeklyBriefingEmailPayload
) => Promise<{ ok: true } | { ok: false; error: string }>;

export type BriefingListRow = {
  id: string;
  weekStart: Date;
  content: string;
  sentAt: Date | null;
  createdAt: Date;
};

export type UpsertedBriefing = {
  id: string;
  weekStart: Date;
  content: string;
  sentAt: Date | null;
};

export type BriefingRepository = {
  listRowsForUser: (userId: string) => Promise<BriefingListRow[]>;
  upsertForWeek: (params: {
    userId: string;
    weekStart: Date;
    content: string;
    sentAt?: Date | null;
  }) => Promise<UpsertedBriefing>;
  getByIdForUser: (
    briefingId: string,
    userId: string
  ) => Promise<BriefingListRow | null>;
  recordFeedback: (
    briefingId: string,
    userId: string,
    sentiment: Sentiment
  ) => Promise<void>;
};

export type EventQueryPort = (
  userId: string,
  range: { start: Date; end: Date }
) => Promise<Event[]>;

export type UserQueryPort = (
  userId: string
) => Promise<{ name: string; familyName: string; email: string } | null>;

export type ActiveUsersQueryPort = () => Promise<
  { id: string; email: string; name: string; familyName: string }[]
>;
