/**
 * Resend setup (production):
 * 1. Sign up at https://resend.com (free tier: 3,000 emails/month)
 * 2. Add and verify your domain (or use onboarding@resend.dev for testing)
 * 3. Create an API key and add to .env.local as RESEND_API_KEY
 * 4. For local testing, send to your own email — Resend's free tier allows
 *    sending to any address once your domain is verified
 */
import { Resend } from "resend";
import type { WeeklyBriefingEmailPort } from "@/application/briefing/briefingPorts";
import { parseBriefingSections } from "@/lib/briefing/parseSections";

const FROM = "FamilyBrief <briefing@familybrief.app>";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildWeeklyBriefingHtml(params: {
  familyName: string;
  briefingContent: string;
  briefingId: string;
}): string {
  const sections = parseBriefingSections(params.briefingContent);
  const blocks = sections.map((sec, i) => {
    const title = escapeHtml(sec.title);
    const body = escapeHtml(sec.body).replace(/\n/g, "<br/>");
    const hr =
      i > 0
        ? `<tr><td style="padding:0 0 16px 0;"><hr style="border:none;border-top:1px solid #F59E0B;margin:0;" /></td></tr>`
        : "";
    return `${hr}<tr><td style="padding:0 0 8px 0;font-family:'DM Sans',Arial,sans-serif;font-size:16px;line-height:1.65;color:#1A1714;"><strong style="font-family:'Fraunces',Georgia,serif;font-size:18px;color:#1A1714;">${title}</strong><br/><br/>${body}</td></tr>`;
  });

  const feedbackUp = `mailto:hello@familybrief.app?subject=${encodeURIComponent("Briefing feedback")}&body=${encodeURIComponent(`Briefing ID: ${params.briefingId}\nFeedback: thumbs up\n`)}`;
  const feedbackDown = `mailto:hello@familybrief.app?subject=${encodeURIComponent("Briefing feedback")}&body=${encodeURIComponent(`Briefing ID: ${params.briefingId}\nFeedback: thumbs down\n`)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:#FAF8F4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F4;padding:24px 12px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;box-shadow:0 2px 12px rgba(26,23,20,0.08);overflow:hidden;">
        <tr>
          <td style="padding:28px 28px 8px 28px;font-family:'Fraunces',Georgia,serif;font-size:22px;color:#F59E0B;">FamilyBrief</td>
        </tr>
        <tr>
          <td style="padding:0 28px 8px 28px;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#6b7280;">${escapeHtml(params.familyName)}</td>
        </tr>
        ${blocks.join("")}
        <tr>
          <td style="padding:24px 28px 8px 28px;font-family:'DM Sans',Arial,sans-serif;font-size:14px;">
            <a href="${feedbackUp}" style="color:#F59E0B;text-decoration:none;margin-right:16px;">👍 Helpful</a>
            <a href="${feedbackDown}" style="color:#F59E0B;text-decoration:none;">👎 Not helpful</a>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 28px 28px 28px;font-family:'DM Sans',Arial,sans-serif;font-size:12px;color:#9ca3af;">
            FamilyBrief · <a href="mailto:hello@familybrief.app?subject=Unsubscribe" style="color:#9ca3af;">Unsubscribe</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function buildPlainText(params: {
  briefingContent: string;
  briefingId: string;
}): string {
  const footer = `\n\n—\nFamilyBrief · Feedback: reply with briefing ID ${params.briefingId}\n`;
  return `${params.briefingContent.trim()}${footer}`;
}

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWeeklyBriefingEmail: WeeklyBriefingEmailPort = async (
  payload
) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured" };
  }

  const subject = `Your Family Week Ahead — ${payload.weekOf}`;
  const html = buildWeeklyBriefingHtml({
    familyName: payload.familyName,
    briefingContent: payload.briefingContent,
    briefingId: payload.briefingId,
  });
  const text = buildPlainText({
    briefingContent: payload.briefingContent,
    briefingId: payload.briefingId,
  });

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: payload.toEmail,
      subject,
      html,
      text,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
};

export function getUserInboundEmail(userId: string): string {
  return `family+${userId}@inbound.familybrief.app`;
}
