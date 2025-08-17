// src/app/api/test-transcription/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ 
        ok: false, 
        error: 'No audio file provided' 
      }, { status: 400 });
    }

    // Get file info
    const fileInfo = {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
      lastModified: audioFile.lastModified
    };

    // For testing, return file info and a mock transcript
    // In production, this would call Deepgram API
    const mockTranscript = `This is a test transcript for the audio file: ${audioFile.name}. 
    
    The file is ${(audioFile.size / 1024).toFixed(1)} KB and has type ${audioFile.type}.
    
    This demonstrates that the endpoint is working and can receive audio files.`;

    const mockSummary = `Test Summary:
    • Audio file: ${audioFile.name}
    • File size: ${(audioFile.size / 1024).toFixed(1)} KB
    • File type: ${audioFile.type}
    • Endpoint working: ✅`;

    return NextResponse.json({ 
      ok: true, 
      transcript: mockTranscript,
      summary: mockSummary,
      confidence: 0.95,
      words: [],
      audioInfo: {
        duration: 0,
        channels: 1,
        sampleRate: 0
      },
      fileInfo,
      message: 'Test endpoint working! Audio file received successfully.'
    });

  } catch (err: any) {
    console.error('[test-transcription] error:', err);
    return NextResponse.json({ 
      ok: false, 
      error: err?.message || 'Test transcription failed' 
    }, { status: 500 });
  }
}
