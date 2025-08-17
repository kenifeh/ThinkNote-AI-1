// src/app/api/research/openalex/route.ts
import { NextResponse } from 'next/server';
import { OPENALEX_BASE } from '@/lib/ai/clients';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const perPage = Number(searchParams.get('per_page') || 5);

    if (!q) return NextResponse.json({ ok: false, error: 'Missing q' }, { status: 400 });

    const url = `${OPENALEX_BASE}/works?search=${encodeURIComponent(q)}&per_page=${perPage}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'ThinkNoteAI/1.0' } });
    const data = await r.json();

    // normalize a bit
    const results = (data?.results || []).map((w: any) => ({
      id: w.id,
      title: w.title,
      authors: (w.authorships || []).map((a: any) => a.author?.display_name).filter(Boolean),
      year: w.publication_year,
      oa: w.open_access?.is_oa || false,
      venue: w.host_venue?.display_name || '',
      url: w.open_access?.oa_url || w.primary_location?.source?.url || null,
      cited_by: w.cited_by_count || 0,
      abstract: w.abstract_inverted_index ? invertAbstract(w.abstract_inverted_index) : '',
    }));

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    console.error('[research/openalex] error', err);
    return NextResponse.json({ ok: false, error: err?.message || 'failed' }, { status: 500 });
  }
}

function invertAbstract(inv: Record<string, number[]>) {
  const positions: [number, string][] = [];
  for (const [word, inds] of Object.entries(inv)) {
    for (const i of inds) positions.push([i, word]);
  }
  positions.sort((a, b) => a[0] - b[0]);
  return positions.map(([, w]) => w).join(' ');
}
