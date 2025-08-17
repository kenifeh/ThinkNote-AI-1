// src/app/api/flashcards/generate/route.ts
import { NextResponse } from 'next/server';
import { openai, CHAT_MODEL } from '@/lib/ai/clients';
import { FLASHCARD_INSTRUCTIONS } from '@/lib/ai/prompts';
import { takeFirstChars } from '@/lib/utils/text';

type Body = {
  sourceTitle?: string;
  text: string; // transcript or summary
  count?: number; // optional target count
};

export async function POST(req: Request) {
  try {
    const { text, sourceTitle, count = 15 } = (await req.json()) as Body;

    const prompt = `
Create approximately ${count} flashcards from the following content.
${FLASHCARD_INSTRUCTIONS}

CONTENT:
"""${takeFirstChars(text, 16000)}"""
    `;

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: 'You output only valid JSON arrays. No extra prose.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '[]';
    // attempt to parse robustly
    const firstBracket = raw.indexOf('[');
    const lastBracket = raw.lastIndexOf(']');
    const slice = firstBracket >= 0 && lastBracket > firstBracket ? raw.slice(firstBracket, lastBracket + 1) : '[]';

    let items: { q: string; a: string }[] = [];
    try {
      items = JSON.parse(slice);
    } catch {
      // fallback: single item
      items = [{ q: 'Unable to parse', a: 'Try regenerating.' }];
    }

    return NextResponse.json({ ok: true, items, sourceTitle: sourceTitle || null });
  } catch (err: any) {
    console.error('[flashcards/generate] error', err);
    return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 });
  }
}
