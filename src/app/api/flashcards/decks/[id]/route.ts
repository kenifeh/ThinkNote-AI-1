import { NextResponse } from 'next/server';

// Use proper typing for global state
declare global {
  var DECKS: any[];
}

// Initialize global decks array if it doesn't exist
if (!global.DECKS) {
  global.DECKS = [];
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  global.DECKS = global.DECKS.filter((d: any) => d.id !== id);
  return NextResponse.json({ ok: true });
}
