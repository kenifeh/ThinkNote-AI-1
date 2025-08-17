import { NextResponse } from 'next/server';

// Use proper typing for global state
declare global {
  var DECKS: any[];
}

// Initialize global decks array if it doesn't exist
if (!global.DECKS) {
  global.DECKS = [];
}

export async function GET() {
  return NextResponse.json({ decks: global.DECKS });
}

export async function POST(req: Request) {
  const body = await req.json();
  const deck = {
    id: crypto.randomUUID(),
    title: body.title ?? 'Untitled Deck',
    tags: body.tags ?? [],
    cards: [],
  };
  global.DECKS.unshift(deck);
  return NextResponse.json({ deck });
}
