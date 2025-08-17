// src/app/api/voice/speak/route.ts
import { NextResponse } from 'next/server';
import { ELEVEN_BASE, ELEVEN_KEY, ELEVEN_VOICE_ID } from '@/lib/ai/clients';

export const runtime = 'nodejs';

type Body = { text: string };

export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as Body;
    if (!text) return NextResponse.json({ ok: false, error: 'No text' }, { status: 400 });

    const r = await fetch(`${ELEVEN_BASE}/text-to-speech/${ELEVEN_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2', // stable, natural
        voice_settings: { stability: 0.4, similarity_boost: 0.65 },
      }),
    });

    if (!r.ok || !r.body) {
      const msg = await r.text();
      throw new Error(`ElevenLabs error: ${msg}`);
    }

    return new NextResponse(r.body as any, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error('[voice/speak] error', err);
    return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 });
  }
}
