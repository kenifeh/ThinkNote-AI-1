import { NextResponse } from 'next/server';
import { generateStudyResponse } from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const { text, context } = await req.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Generate study response using OpenAI
    const reply = await generateStudyResponse(text, context || '');
    
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Study reply error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
