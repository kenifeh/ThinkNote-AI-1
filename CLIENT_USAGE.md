# ThinkNote AI Client Usage Guide

## 🚀 Quick Start

```typescript
import { 
  sendChatMessage, 
  generateFlashcards, 
  speakAndPlay, 
  searchResearch,
  transcribeAudio,
  createLiveTranscription 
} from '@/lib/client-api';
```

## 💬 Chat & AI Interactions

### Study Mode with Context
```typescript
const response = await sendChatMessage('study', [
  { role: 'user', content: 'Explain the core idea of backprop.' }
], { 
  title: 'ML Lecture', 
  text: transcriptOrSummaryText 
});

if (response.ok) {
  console.log('AI Response:', response.content);
}
```

### Socratic Mode
```typescript
const response = await sendChatMessage('socratic', [
  { role: 'user', content: 'What is learning?' }
]);

if (response.ok) {
  console.log('Socratic Question:', response.content);
}
```

## 🃏 Flashcard Generation

### Basic Generation
```typescript
const flashcards = await generateFlashcards(transcriptOrSummaryText, 15);

if (flashcards.ok) {
  flashcards.items.forEach(card => {
    console.log(`Q: ${card.q}`);
    console.log(`A: ${card.a}`);
  });
}
```

### With Source Title
```typescript
const flashcards = await generateFlashcards(
  transcriptOrSummaryText, 
  20, 
  'Machine Learning Fundamentals'
);
```

## 🗣️ Text-to-Speech (Sage Voice)

### Speak and Play Immediately
```typescript
await speakAndPlay('Let\'s sharpen your mind.');
```

### Get Audio Element for Control
```typescript
const audio = await speakText('This is a longer response that you can control.');
if (audio) {
  audio.volume = 0.8;
  audio.playbackRate = 1.2;
  await audio.play();
  
  // Pause after 3 seconds
  setTimeout(() => audio.pause(), 3000);
}
```

## 🔬 Academic Research

### Search Papers
```typescript
const research = await searchResearch('gradient descent', 5);

if (research.ok) {
  research.results.forEach(paper => {
    console.log(`Title: ${paper.title}`);
    console.log(`Authors: ${paper.authors.join(', ')}`);
    console.log(`Year: ${paper.year}`);
    console.log(`Citations: ${paper.cited_by}`);
    console.log(`Open Access: ${paper.oa ? 'Yes' : 'No'}`);
    console.log(`URL: ${paper.url}`);
    console.log(`Abstract: ${paper.abstract}`);
    console.log('---');
  });
}
```

## 🎤 Audio Transcription

### Transcribe Audio File
```typescript
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    const result = await transcribeAudio(file);
    
    if (result.ok) {
      console.log('Transcript:', result.transcript);
      console.log('Confidence:', result.confidence);
      console.log('Word timing:', result.words);
    } else {
      console.error('Transcription failed:', result.error);
    }
  }
});
```

## 🌊 Live Transcription

### Real-time Speech-to-Text
```typescript
let ws: WebSocket;

async function startLiveTranscription() {
  try {
    ws = await createLiveTranscription(
      // On transcript received
      (text, isFinal) => {
        if (isFinal) {
          console.log('Final transcript:', text);
          // Process complete transcript
        } else {
          console.log('Partial transcript:', text);
          // Show live feedback
        }
      },
      // On error
      (error) => {
        console.error('Live transcription error:', error);
      }
    );
    
    console.log('Live transcription started');
  } catch (error) {
    console.error('Failed to start live transcription:', error);
  }
}

function stopLiveTranscription() {
  if (ws) {
    ws.close();
    ws = null;
  }
}

// Start/stop buttons
document.getElementById('startBtn').onclick = startLiveTranscription;
document.getElementById('stopBtn').onclick = stopLiveTranscription;
```

## 🎯 Complete Workflows

### Interactive Study Session
```typescript
import { interactiveStudyResponse } from '@/lib/client-api';

async function handleStudyQuestion(question: string, contextText: string) {
  try {
    // This will: get AI response, generate flashcards, and speak the response
    await interactiveStudyResponse(question, contextText, 'Study Session');
    console.log('Complete study session completed!');
  } catch (error) {
    console.error('Study session failed:', error);
  }
}
```

### Complete Study Session with Materials
```typescript
import { completeStudySession } from '@/lib/client-api';

async function fullStudyWorkflow(question: string, contextText: string) {
  const { chatResponse, flashcards } = await completeStudySession(
    question, 
    contextText, 
    'Machine Learning Lecture'
  );
  
  if (chatResponse.ok) {
    // Display AI response
    displayResponse(chatResponse.content);
    
    // Speak the response
    await speakAndPlay(chatResponse.content);
  }
  
  if (flashcards.ok) {
    // Display flashcards
    displayFlashcards(flashcards.items);
  }
}
```

## 🔧 Error Handling

### Robust API Calls
```typescript
async function safeAPIcall<T>(
  apiCall: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    console.error('API call failed:', error);
    return fallback;
  }
}

// Usage
const response = await safeAPIcall(
  () => sendChatMessage('study', messages, context),
  { ok: false, content: 'Service temporarily unavailable', error: 'fallback' }
);
```

## 📱 React Hook Example

```typescript
import { useState, useCallback } from 'react';
import { sendChatMessage, speakAndPlay } from '@/lib/client-api';

export function useThinkNoteAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askQuestion = useCallback(async (
    mode: 'socratic' | 'study',
    question: string,
    context?: { title?: string; text?: string }
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await sendChatMessage(mode, [
        { role: 'user', content: question }
      ], context);
      
      if (response.ok) {
        // Speak the response
        await speakAndPlay(response.content);
        return response.content;
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { askQuestion, isLoading, error };
}
```

## 🎨 UI Integration Examples

### Chat Interface
```typescript
function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const { askQuestion, isLoading } = useThinkNoteAI();

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    try {
      const response = await askQuestion('study', input, {
        title: 'Current Document',
        text: 'Your document content here...'
      });
      
      const aiMessage: ChatMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to get response:', error);
    }
  };

  return (
    <div>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
      </div>
      
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Sage a question..."
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading}>
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
```

## 🚨 Important Notes

1. **Error Handling**: Always check `response.ok` before using data
2. **Audio Cleanup**: URLs created by `speakText` are automatically cleaned up
3. **WebSocket Management**: Close WebSocket connections when done
4. **File Types**: Audio transcription supports common formats (WAV, MP3, M4A, etc.)
5. **Rate Limiting**: Be mindful of API rate limits for production use

## 🔗 API Endpoints Summary

- **`/api/thinkspace/chat`** - Unified chat (Socratic/Study modes)
- **`/api/flashcards/generate`** - Generate study flashcards
- **`/api/voice/speak`** - Text-to-speech with Sage voice
- **`/api/research/openalex`** - Academic paper search
- **`/api/audio/transcribe`** - Audio file transcription
- **`/api/audio/stream-token`** - Live transcription token

Your ThinkNote AI is now fully accessible from the client side! 🎉
