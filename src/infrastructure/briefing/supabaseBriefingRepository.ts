import type {
  BriefingListRow,
  BriefingRepository,
  UpsertedBriefing,
} from "@/application/briefing/briefingPorts";
import { parseIsoDate, toIsoDateString } from "@/lib/briefing/week";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Row = {
  id: string;
  user_id: string;
  week_start: string;
  content: string;
  sent_at: string | null;
  created_at: string;
};

function mapRow(r: Row): BriefingListRow {
  return {
    id: r.id,
    weekStart: parseIsoDate(r.week_start),
    content: r.content,
    sentAt: r.sent_at ? new Date(r.sent_at) : null,
    createdAt: new Date(r.created_at),
  };
}

export const supabaseBriefingRepository: BriefingRepository = {
  async listRowsForUser(userId: string): Promise<BriefingListRow[]> {
    const { data, error } = await supabaseAdmin
      .from("weekly_briefings")
      .select("id, user_id, week_start, content, sent_at, created_at")
      .eq("user_id", userId)
      .order("week_start", { ascending: false });

    if (error) throw new Error(error.message);
    return ((data as Row[]) ?? []).map(mapRow);
  },

  async upsertForWeek(params: {
    userId: string;
    weekStart: Date;
    content: string;
    sentAt?: Date | null;
  }): Promise<UpsertedBriefing> {
    const weekKey = toIsoDateString(params.weekStart);

    const { data: existing } = await supabaseAdmin
      .from("weekly_briefings")
      .select("id, sent_at")
      .eq("user_id", params.userId)
      .eq("week_start", weekKey)
      .maybeSingle();

    if (existing) {
      const patch: Record<string, unknown> = { content: params.content };
      if (params.sentAt !== undefined && params.sentAt !== null) {
        patch.sent_at = params.sentAt.toISOString();
      }

      const { error } = await supabaseAdmin
        .from("weekly_briefings")
        .update(patch)
        .eq("id", existing.id);

      if (error) throw new Error(error.message);

      const { data: row } = await supabaseAdmin
        .from("weekly_briefings")
        .select("id, week_start, content, sent_at")
        .eq("id", existing.id)
        .single();

      if (!row) throw new Error("Briefing not found after update");
      const r = row as Pick<
        Row,
        "id" | "week_start" | "content" | "sent_at"
      >;
      return {
        id: r.id,
        weekStart: parseIsoDate(r.week_start),
        content: r.content,
        sentAt: r.sent_at ? new Date(r.sent_at) : null,
      };
    }

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("weekly_briefings")
      .insert({
        user_id: params.userId,
        week_start: weekKey,
        content: params.content,
        sent_at: params.sentAt ? params.sentAt.toISOString() : null,
      })
      .select("id, week_start, content, sent_at")
      .single();

    if (insErr) throw new Error(insErr.message);
    const r = inserted as Pick<Row, "id" | "week_start" | "content" | "sent_at">;
    return {
      id: r.id,
      weekStart: parseIsoDate(r.week_start),
      content: r.content,
      sentAt: r.sent_at ? new Date(r.sent_at) : null,
    };
  },

  async getByIdForUser(
    briefingId: string,
    userId: string
  ): Promise<BriefingListRow | null> {
    const { data, error } = await supabaseAdmin
      .from("weekly_briefings")
      .select("id, user_id, week_start, content, sent_at, created_at")
      .eq("id", briefingId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapRow(data as Row);
  },
};
