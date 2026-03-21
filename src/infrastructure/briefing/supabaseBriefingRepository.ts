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

type RpcUpsertRow = {
  id: string;
  week_start: string;
  content: string;
  sent_at: string | null;
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

function mapUpsertRow(r: RpcUpsertRow): UpsertedBriefing {
  return {
    id: r.id,
    weekStart: parseIsoDate(r.week_start),
    content: r.content,
    sentAt: r.sent_at ? new Date(r.sent_at) : null,
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
    const sentAt = params.sentAt;
    const pSetSent = sentAt !== undefined && sentAt !== null;

    const { data, error } = await supabaseAdmin.rpc("upsert_weekly_briefing", {
      p_user_id: params.userId,
      p_week_start: weekKey,
      p_content: params.content,
      p_sent_at: pSetSent ? sentAt.toISOString() : null,
      p_set_sent_at: pSetSent,
    });

    if (error) throw new Error(error.message);

    const raw = Array.isArray(data) ? data[0] : data;
    if (!raw || typeof raw !== "object") {
      throw new Error("upsert_weekly_briefing returned no row");
    }
    return mapUpsertRow(raw as RpcUpsertRow);
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

  async recordFeedback(
    briefingId: string,
    userId: string,
    sentiment: "up" | "down"
  ): Promise<void> {
    const { error } = await supabaseAdmin.from("briefing_feedback").insert({
      briefing_id: briefingId,
      user_id: userId,
      sentiment,
    });

    if (error) throw new Error(error.message);
  },
};
