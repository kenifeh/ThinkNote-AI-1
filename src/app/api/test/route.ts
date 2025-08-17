import { NextResponse } from 'next/server';
import { generateSocraticQuestion } from '@/lib/openai';

export async function POST() {
  try {
    // Test OpenAI integration
    const testQuestion = await generateSocraticQuestion("What is learning?");
    
    return NextResponse.json({ 
      ok: true, 
      openai_working: true,
      test_response: testQuestion,
      message: "OpenAI integration is working!"
    });
  } catch (error) {
    console.error('OpenAI test error:', error);
    return NextResponse.json({ 
      ok: false, 
      openai_working: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: "OpenAI integration failed. Check your API key and environment variables."
    });
  }
}
