import { NextResponse } from 'next/server';
import { generateSocraticQuestion } from '@/lib/openai';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Generate Socratic question using OpenAI
    const reply = await generateSocraticQuestion(text);
    
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Socratic reply error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}
