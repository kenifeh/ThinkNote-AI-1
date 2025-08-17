// src/lib/client-api.ts
// Client-side utilities for ThinkNote AI APIs

// ===== CHAT & AI INTERACTIONS =====

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StudyContext {
  title?: string;
  text?: string;
}

export interface ChatResponse {
  ok: boolean;
  content: string;
  error?: string;
}

/**
 * Send a message to the unified chat endpoint
 */
export async function sendChatMessage(
  mode: 'socratic' | 'study',
  messages: ChatMessage[],
  context?: StudyContext
): Promise<ChatResponse> {
  try {
    const response = await fetch('/api/thinkspace/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, messages, context }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Chat API error:', error);
    return { ok: false, content: '', error: 'Network error' };
  }
}

// ===== FLASHCARD GENERATION =====

export interface FlashcardItem {
  q: string;
  a: string;
}

export interface FlashcardResponse {
  ok: boolean;
  items: FlashcardItem[];
  sourceTitle?: string;
  error?: string;
}

/**
 * Generate flashcards from text content
 */
export async function generateFlashcards(
  text: string,
  count: number = 15,
  sourceTitle?: string
): Promise<FlashcardResponse> {
  try {
    const response = await fetch('/api/flashcards/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, count, sourceTitle }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Flashcard generation error:', error);
    return { ok: false, items: [], error: 'Network error' };
  }
}

// ===== TEXT-TO-SPEECH =====

/**
 * Convert text to speech using Sage's voice
 */
export async function speakText(text: string): Promise<HTMLAudioElement | null> {
  try {
    const response = await fetch('/api/voice/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`TTS failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    
    // Clean up URL after audio loads
    audio.addEventListener('loadeddata', () => {
      URL.revokeObjectURL(audioUrl);
    });

    return audio;
  } catch (error) {
    console.error('TTS error:', error);
    return null;
  }
}

/**
 * Play text immediately (convenience function)
 */
export async function speakAndPlay(text: string): Promise<void> {
  const audio = await speakText(text);
  if (audio) {
    await audio.play();
  }
}

// ===== ACADEMIC RESEARCH =====

export interface ResearchResult {
  id: string;
  title: string;
  authors: string[];
  year: number;
  oa: boolean;
  venue: string;
  url: string | null;
  cited_by: number;
  abstract: string;
}

export interface ResearchResponse {
  ok: boolean;
  results: ResearchResult[];
  error?: string;
}

/**
 * Search academic papers using OpenAlex
 */
export async function searchResearch(
  query: string,
  perPage: number = 5
): Promise<ResearchResponse> {
  try {
    const response = await fetch(
      `/api/research/openalex?q=${encodeURIComponent(query)}&per_page=${perPage}`
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Research search error:', error);
    return { ok: false, results: [], error: 'Network error' };
  }
}

// ===== AUDIO TRANSCRIPTION =====

export interface TranscriptionResponse {
  ok: boolean;
  transcript: string;
  confidence: number;
  words: any[];
  error?: string;
}

/**
 * Transcribe an audio file (legacy function - now uses the unified endpoint)
 */
export async function transcribeAudio(audioFile: File): Promise<TranscriptionResponse> {
  try {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('summarize', 'false'); // Don't generate summary for legacy compatibility

    const response = await fetch('/api/audio/transcribe-summarize', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Transcription error:', error);
    return { 
      ok: false, 
      transcript: '', 
      confidence: 0, 
      words: [], 
      error: 'Network error' 
    };
  }
}

// ===== TRANSCRIPTION & SUMMARIZATION =====

export interface TranscriptionSummaryResponse {
  ok: boolean;
  transcript: string;
  summary: string | null;
  confidence: number;
  words: any[];
  audioInfo: {
    duration: number;
    channels: number;
    sampleRate: number;
  };
  error?: string;
}

/**
 * Transcribe audio and optionally generate AI summary
 */
export async function transcribeAndSummarize(
  audioFile: File,
  generateSummary: boolean = true
): Promise<TranscriptionSummaryResponse> {
  try {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('summarize', generateSummary.toString());

    const response = await fetch('/api/audio/transcribe-summarize', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Transcription and summarization error:', error);
    return { 
      ok: false, 
      transcript: '', 
      summary: null,
      confidence: 0, 
      words: [], 
      audioInfo: { duration: 0, channels: 1, sampleRate: 0 },
      error: 'Network error' 
    };
  }
}

/**
 * Generate a sophisticated summary using the new summary system
 */
export async function generateSummary(transcript: string): Promise<{
  ok: boolean;
  summary: string;
  transcriptWords: number;
  summaryWords: number;
  policy: {
    target: number;
    hardCap: number;
    mustBeShorterThan: number;
  };
  error?: string;
}> {
  try {
    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Summary generation error:', error);
    return {
      ok: false,
      summary: '',
      transcriptWords: 0,
      summaryWords: 0,
      policy: { target: 0, hardCap: 0, mustBeShorterThan: 0 },
      error: 'Network error'
    };
  }
}

/**
 * Test transcription endpoint (for development/testing)
 */
export async function testTranscription(audioFile: File): Promise<TranscriptionSummaryResponse> {
  try {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await fetch('/api/test-transcription', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Test transcription error:', error);
    return { 
      ok: false, 
      transcript: '', 
      summary: null,
      confidence: 0, 
      words: [], 
      audioInfo: { duration: 0, channels: 1, sampleRate: 0 },
      error: 'Network error' 
    };
  }
}

// ===== LIVE TRANSCRIPTION =====

export interface StreamTokenResponse {
  ok: boolean;
  key: string;
  error?: string;
}

/**
 * Get Deepgram API key for live streaming
 */
export async function getStreamToken(): Promise<StreamTokenResponse> {
  try {
    const response = await fetch('/api/audio/stream-token');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Stream token error:', error);
    return { ok: false, key: '', error: 'Network error' };
  }
}

/**
 * Create WebSocket connection for live transcription
 */
export function createLiveTranscription(
  onTranscript: (text: string, isFinal: boolean) => void,
  onError: (error: string) => void
): Promise<WebSocket> {
  return getStreamToken().then(({ ok, key, error }) => {
    if (!ok || !key) {
      throw new Error(error || 'Failed to get stream token');
    }

    const ws = new WebSocket('wss://api.deepgram.com/v1/listen', ['token', key]);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const transcript = data?.channel?.alternatives?.[0]?.transcript || '';
        const isFinal = data?.is_final || false;
        
        if (transcript) {
          onTranscript(transcript, isFinal);
        }
      } catch (parseError) {
        console.error('WebSocket message parse error:', parseError);
      }
    };

    ws.onerror = (event) => {
      onError('WebSocket error occurred');
    };

    ws.onclose = () => {
      console.log('Live transcription WebSocket closed');
    };

    return ws;
  });
}

// ===== CONVENIENCE FUNCTIONS =====

/**
 * Complete study session workflow
 */
export async function completeStudySession(
  question: string,
  contextText: string,
  contextTitle?: string
): Promise<{
  chatResponse: ChatResponse;
  flashcards: FlashcardResponse;
}> {
  // Get AI response
  const chatResponse = await sendChatMessage('study', [
    { role: 'user', content: question }
  ], { title: contextTitle, text: contextText });

  // Generate flashcards
  const flashcards = await generateFlashcards(contextText, 15, contextTitle);

  return { chatResponse, flashcards };
}

/**
 * Speak AI response and generate study materials
 */
export async function interactiveStudyResponse(
  question: string,
  contextText: string,
  contextTitle?: string
): Promise<void> {
  const { chatResponse } = await completeStudySession(question, contextText, contextTitle);
  
  if (chatResponse.ok && chatResponse.content) {
    // Speak the response
    await speakAndPlay(chatResponse.content);
  }
}

/**
 * Complete audio-to-study workflow
 */
export async function audioToStudyWorkflow(
  audioFile: File,
  question: string
): Promise<{
  transcript: string;
  summary: string | null;
  chatResponse: ChatResponse;
  flashcards: FlashcardResponse;
}> {
  // Step 1: Transcribe and summarize audio
  const transcriptionResult = await transcribeAndSummarize(audioFile, true);
  
  if (!transcriptionResult.ok) {
    throw new Error(transcriptionResult.error || 'Transcription failed');
  }

  // Step 2: Use transcript as context for study session
  const { chatResponse, flashcards } = await completeStudySession(
    question,
    transcriptionResult.transcript,
    'Audio Recording'
  );

  return {
    transcript: transcriptionResult.transcript,
    summary: transcriptionResult.summary,
    chatResponse,
    flashcards
  };
}
