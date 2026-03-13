export async function sendWeeklyBriefing(
  toEmail: string,
  toName: string,
  briefingContent: string,
  weekOf: string
) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'FamilyBrief <briefing@familybrief.app>',
      to: toEmail,
      subject: `Your Family Week Ahead — ${weekOf}`,
      text: briefingContent,
    }),
  });
  return response.json();
}

export function getUserInboundEmail(userId: string): string {
  return `family+${userId}@inbound.familybrief.app`;
}
