// src/app/api/audio/stream-token/route.ts
import { NextResponse } from 'next/server';
import { DG_KEY } from '@/lib/ai/clients';

/**
 * MVP approach: send the Deepgram API key to client so it can open
 * wss://api.deepgram.com/v1/listen directly.
 * NOTE: In production, prefer a short-lived proxy/token solution
 * (or restrict key by domain in Deepgram console).
 */
export async function GET() {
  if (!DG_KEY) return NextResponse.json({ ok: false, error: 'No DG key' }, { status: 500 });
  return NextResponse.json({ ok: true, key: DG_KEY });
}
