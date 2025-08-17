// src/app/api/thinkspace/chat/route.ts
import { NextResponse } from 'next/server';
import { openai, CHAT_MODEL } from '@/lib/ai/clients';
import { SYSTEM_SOCRATIC, SYSTEM_STUDY } from '@/lib/ai/prompts';
import { takeFirstChars } from '@/lib/utils/text';

type Body = {
  mode: 'socratic' | 'study';
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  context?: { title?: string; text?: string }; // transcript/summary for study mode
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const system =
      body.mode === 'socratic'
        ? SYSTEM_SOCRATIC
        : SYSTEM_STUDY +
          (body.context?.text
            ? `\n\nPrimary context:\n"""${takeFirstChars(body.context.text, 12000)}"""\n`
            : '');

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: system },
        ...body.messages,
      ],
      temperature: body.mode === 'socratic' ? 0.8 : 0.5,
    });

    const content = completion.choices[0]?.message?.content || '';
    return NextResponse.json({ ok: true, content });
  } catch (err: any) {
    console.error('[thinkspace/chat] error', err);
    return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 });
  }
}
