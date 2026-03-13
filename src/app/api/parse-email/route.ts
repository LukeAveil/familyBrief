import { NextRequest, NextResponse } from 'next/server';
import { parseEmailToEvents } from '@/lib/anthropic';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const toAddress: string = payload.to || '';
  const userIdMatch = toAddress.match(/family\+([^@]+)@/);
  if (!userIdMatch) return NextResponse.json({ error: 'Invalid address' }, { status: 400 });

  const userId = userIdMatch[1];
  const { data: members } = await supabaseAdmin
    .from('family_members').select('id, name').eq('user_id', userId);

  const extractedEvents = await parseEmailToEvents(
    payload.subject, payload.text || payload.html, members || []
  );

  const { data: savedEmail } = await supabaseAdmin
    .from('parsed_emails')
    .insert({ user_id: userId, from_address: payload.from, subject: payload.subject, body: payload.text, processed: true })
    .select().single();

  if (extractedEvents.length > 0 && members) {
    const eventsToInsert = extractedEvents.map((e: any) => {
      const member = members.find((m: any) => m.name === e.familyMemberName);
      return {
        user_id: userId, family_member_id: member?.id || null,
        title: e.title, description: e.description, date: e.date,
        time: e.time, location: e.location, category: e.category,
        source: 'email', raw_email_id: savedEmail?.id,
      };
    });
    await supabaseAdmin.from('events').insert(eventsToInsert);
  }

  return NextResponse.json({ success: true, eventsCreated: extractedEvents.length });
}
