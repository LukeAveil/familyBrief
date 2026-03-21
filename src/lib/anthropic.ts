import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/** Shared JSON shape for email + vision extraction prompts (single source of truth). */
export const EXTRACTED_EVENTS_JSON_SCHEMA_PROMPT = `[{
  "title": "event title",
  "date": "YYYY-MM-DD",
  "time": "HH:MM or null",
  "location": "location or null",
  "category": "school|activity|medical|social|other",
  "familyMemberName": "name or null",
  "description": "brief description"
}]`;

export function parseJsonArrayFromAssistantText(text: string): unknown[] {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/m;
  const m = trimmed.match(fence);
  const jsonStr = m ? m[1].trim() : trimmed;
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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
${EXTRACTED_EVENTS_JSON_SCHEMA_PROMPT}
If no events found, return [].`,
    }],
  });
  const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
  return parseJsonArrayFromAssistantText(text);
}

/** Raster types supported by Claude image blocks (image/* uploads must map to one of these). */
export const VISION_IMAGE_MEDIA_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

/**
 * Extract calendar events from a base64-encoded image or PDF using Claude vision / document input.
 * Same JSON shape as parseEmailToEvents.
 */
export async function parseImageOrPdfToEvents(
  base64: string,
  mediaType: string,
  familyMembers: { name: string; id: string }[]
) {
  const familyLine =
    familyMembers.map((m) => m.name).join(', ') || '(none specified)';

  const system = `You extract calendar events from photos, screenshots, scans, and PDFs (school letters, newsletters, timetables, chat screenshots).
Use the listed family member names when assigning familyMemberName when the document implies a person; otherwise use null.
Infer dates relative to context on the page; if year is missing, use the current year implied by the document or today.
Fields may be unknown: use JSON null for missing time, location, or familyMemberName.
category must be one of: school, activity, medical, social, other.
Respond ONLY with a JSON array, no preamble or markdown.`;

  const schemaHint = `Respond ONLY with a JSON array, no preamble:
${EXTRACTED_EVENTS_JSON_SCHEMA_PROMPT}
If no events found, return [].`;

  const userText = `${schemaHint}

Family members: ${familyLine}

Extract any events, activities, deadlines, or important dates visible in the attached file.`;

  const isPdf = mediaType === 'application/pdf';

  const content: unknown[] = isPdf
    ? [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64,
          },
        },
        { type: 'text', text: userText },
      ]
    : [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType as
              | 'image/jpeg'
              | 'image/png'
              | 'image/gif'
              | 'image/webp',
            data: base64,
          },
        },
        { type: 'text', text: userText },
      ];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system,
    messages: [
      {
        role: 'user',
        content: content as Parameters<
          typeof anthropic.messages.create
        >[0]['messages'][number]['content'],
      },
    ],
  });

  const textBlock = response.content.find((c) => c.type === 'text');
  const text = textBlock?.type === 'text' ? textBlock.text : '[]';
  return parseJsonArrayFromAssistantText(text);
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
The briefing must cover the whole week (Monday through Sunday).
Events this week: ${JSON.stringify(events, null, 2)}
Write a friendly, scannable briefing that:
- Opens with a warm greeting and quick week summary
- Goes through each day of the week (Mon–Sun) with what's on that day or a brief note if nothing is scheduled
- Ends with a short encouraging note
Under 300 words. Plain text only, no markdown.`,
    }],
  });
  return response.content[0].type === 'text' ? response.content[0].text : '';
}
