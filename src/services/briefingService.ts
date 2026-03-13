import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateWeeklyBriefing } from "@/lib/anthropic";
import { sendWeeklyBriefing } from "@/lib/email";

type ActiveUser = {
  id: string;
  email: string;
  name: string;
  family_name: string;
};

export async function sendWeeklyBriefingsForActiveUsers() {
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, email, name, family_name")
    .eq("subscription_status", "active");

  if (!users) {
    return { sent: 0, total: 0 };
  }

  const results = await Promise.allSettled(
    users.map(async (user: ActiveUser) => {
      const weekStart = new Date();
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);

      const { data: events } = await supabaseAdmin
        .from("events")
        .select("*, family_members(name)")
        .eq("user_id", user.id)
        .gte("date", weekStart.toISOString().split("T")[0])
        .lte("date", weekEnd.toISOString().split("T")[0])
        .order("date");

      const formattedEvents = (events || []).map((e: any) => ({
        title: e.title,
        date: e.date,
        time: e.time,
        familyMember: e.family_members?.name || "Family",
        category: e.category,
        location: e.location,
      }));

      const briefing = await generateWeeklyBriefing(
        user.family_name,
        user.name,
        formattedEvents
      );
      const weekOf = weekStart.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
      });
      await sendWeeklyBriefing(user.email, user.name, briefing, weekOf);
      await supabaseAdmin.from("weekly_briefings").insert({
        user_id: user.id,
        week_start: weekStart.toISOString(),
        content: briefing,
        sent_at: new Date().toISOString(),
      });
    })
  );

  return {
    sent: results.filter((r) => r.status === "fulfilled").length,
    total: users.length,
  };
}

