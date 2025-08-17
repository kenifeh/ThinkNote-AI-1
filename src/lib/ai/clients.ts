import OpenAI from 'openai';

// OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model configuration
export const CHAT_MODEL = 'gpt-4o-mini';

// Deepgram (Live transcription)
export const DG_KEY = process.env.DEEPGRAM_API_KEY;

// ElevenLabs (TTS - Sage voice)
export const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;
export const ELEVEN_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
export const ELEVEN_BASE = 'https://api.elevenlabs.io/v1';

// OpenAlex (Research)
export const OPENALEX_BASE = process.env.OPENALEX_BASE || 'https://api.openalex.org';
