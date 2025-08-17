// src/app/api/audio/transcribe-summarize/route.ts
import { NextResponse } from 'next/server';
import { openai, CHAT_MODEL } from '@/lib/ai/clients';
import { DG_KEY } from '@/lib/ai/clients';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const summarize = formData.get('summarize') === 'true';
    
    if (!audioFile) {
      return NextResponse.json({ 
        ok: false, 
        error: 'No audio file provided' 
      }, { status: 400 });
    }

    if (!DG_KEY) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Deepgram API key not configured' 
      }, { status: 500 });
    }

    // Step 1: Transcribe audio using Deepgram
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    
    const transcriptionResponse = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DG_KEY}`,
        'Content-Type': audioFile.type || 'audio/wav',
      },
      body: audioBuffer,
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      throw new Error(`Deepgram API error: ${errorText}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    const transcript = transcriptionResult?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';

    if (!transcript) {
      return NextResponse.json({ 
        ok: false, 
        error: 'No transcript generated from audio' 
      }, { status: 400 });
    }

               // Step 2: Generate AI summary if requested using our sophisticated system
           let summary = null;
           if (summarize && transcript) {
             try {
               const summaryResponse = await fetch(`${process.env.APP_URL || 'http://localhost:3000'}/api/summarize`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ transcript }),
               });

               if (summaryResponse.ok) {
                 const summaryData = await summaryResponse.json();
                 summary = summaryData.summary;
                 console.log('Generated summary with policy:', summaryData.policy);
               } else {
                 console.error('Summary API error:', summaryResponse.statusText);
               }
             } catch (summaryError) {
               console.error('Summary generation error:', summaryError);
               // Continue without summary if it fails
             }
           }

    return NextResponse.json({ 
      ok: true, 
      transcript,
      summary,
      confidence: transcriptionResult?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0,
      words: transcriptionResult?.results?.channels?.[0]?.alternatives?.[0]?.words || [],
      audioInfo: {
        duration: transcriptionResult?.metadata?.duration || 0,
        channels: transcriptionResult?.metadata?.channels || 1,
        sampleRate: transcriptionResult?.metadata?.sample_rate || 0
      }
    });

  } catch (err: any) {
    console.error('[audio/transcribe-summarize] error:', err);
    return NextResponse.json({ 
      ok: false, 
      error: err?.message || 'Transcription and summarization failed' 
    }, { status: 500 });
  }
}
