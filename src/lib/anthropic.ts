import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function parseEmailToEvents(
  emailSubject: string,
  emailBody: string,
  familyMembers: { name: string; id: string }[]
) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `You are a helpful assistant that extracts calendar events from family emails.
Family members: ${familyMembers.map(m => m.name).join(', ')}
Email Subject: ${emailSubject}
Email Body: ${emailBody}
Extract any events, activities, deadlines, or important dates.
Respond ONLY with a JSON array, no preamble:
[{
  "title": "event title",
  "date": "YYYY-MM-DD",
  "time": "HH:MM or null",
  "location": "location or null",
  "category": "school|activity|medical|social|other",
  "familyMemberName": "name or null",
  "description": "brief description"
}]
If no events found, return [].`,
    }],
  });
  const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
  try { return JSON.parse(text); } catch { return []; }
}

export async function generateWeeklyBriefing(
  familyName: string,
  parentName: string,
  events: { title: string; date: string; time?: string; familyMember: string; category: string; location?: string; }[]
) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Generate a warm, concise weekly family briefing for ${parentName} of the ${familyName} family.
Events this week: ${JSON.stringify(events, null, 2)}
Write a friendly, scannable briefing that:
- Opens with a warm greeting and quick week summary
- Lists each day clearly with what needs preparation
- Ends with a short encouraging note
Under 300 words. Plain text only, no markdown.`,
    }],
  });
  return response.content[0].type === 'text' ? response.content[0].text : '';
}
