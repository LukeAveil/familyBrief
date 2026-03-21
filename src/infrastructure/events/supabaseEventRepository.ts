import type {
  EventRepository,
} from "@/application/events/eventPorts";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Event } from "@/types";

export type EventRow = {
  id: string;
  user_id: string;
  family_member_id: string | null;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  location: string | null;
  category: "school" | "activity" | "medical" | "social" | "other";
  source: "manual" | "email" | "image";
  raw_email_id: string | null;
  created_at: string;
  family_members?: {
    id: string;
    name: string;
    color: string;
  } | null;
};

export function mapEventRow(row: EventRow): Event {
  return {
    id: row.id,
    userId: row.user_id,
    familyMemberId: row.family_member_id,
    familyMember: row.family_members
      ? {
          id: row.family_members.id,
          name: row.family_members.name,
          color: row.family_members.color,
        }
      : undefined,
    title: row.title,
    description: row.description ?? undefined,
    date: row.date,
    time: row.time ?? undefined,
    location: row.location ?? undefined,
    category: row.category,
    source: row.source,
    rawEmailId: row.raw_email_id ?? undefined,
    createdAt: row.created_at,
  };
}

export const supabaseEventRepository: EventRepository = {
  async listForUser(userId, range) {
    let query = supabaseAdmin
      .from("events")
      .select("*, family_members(id, name, color)")
      .eq("user_id", userId)
      .order("date");

    if (range?.start) query = query.gte("date", range.start);
    if (range?.end) query = query.lte("date", range.end);

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data as EventRow[] | null)?.map(mapEventRow) ?? [];
  },

  async getByIdForUser(userId, id) {
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("*, family_members(id, name, color)")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapEventRow(data as EventRow);
  },

  async createManualForUser(userId, payload) {
    const { data, error } = await supabaseAdmin
      .from("events")
      .insert({
        user_id: userId,
        title: payload.title,
        date: payload.date,
        time: payload.time ?? null,
        location: payload.location ?? null,
        category: payload.category,
        family_member_id: payload.familyMemberId || null,
        description: payload.description ?? null,
        source: "manual",
      })
      .select("*, family_members(id, name, color)")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapEventRow(data as EventRow);
  },

  async deleteForUser(userId, id) {
    const { error } = await supabaseAdmin
      .from("events")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }
  },
};
