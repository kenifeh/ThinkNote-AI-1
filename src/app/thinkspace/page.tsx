"use client";

import { useState, useRef, useEffect } from "react";
import { generateId } from "@/lib/utils";

/** -------------------- Types -------------------- */
type Mode = "socratic" | "study";
type InputType = "text" | "voice";
type OutputType = "text" | "voice";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  createdAt: string;
}

interface StudySession {
  id: string;
  title: string;
  mode: Mode;
  inputType: InputType;
  outputType: OutputType;
  transcript?: {
    id: string;
    content: string;
    wordCount: number;
  } | null;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  deck: string;
  tags: string[];
}

interface FlashcardDeck {
  id: string;
  name: string;
  cards: Flashcard[];
  tags: string[];
}

/** -------------------- Utils -------------------- */
function speak(text: string) {
  if (!window.speechSynthesis) {
    console.warn("Speech synthesis not supported");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Try to find a female voice
  const voices = window.speechSynthesis.getVoices();
  const femaleVoice = voices.find(voice =>
    voice.name.toLowerCase().includes("female") ||
    voice.name.toLowerCase().includes("sarah") ||
    voice.name.toLowerCase().includes("victoria") ||
    voice.name.toLowerCase().includes("alex")
  );

  utterance.voice = femaleVoice || voices[0] || null;
  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
}

function startVoiceInput(): Promise<string> {
  return new Promise((resolve, reject) => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      reject(new Error("Speech recognition not supported"));
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };

    recognition.onerror = (event: any) => {
      reject(new Error(event.error));
    };

    recognition.start();
  });
}

/** -------------------- SwitchModal Component -------------------- */
function SwitchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-neutral-900">
          File Upload Not Available
        </h3>
        <p className="mb-6 text-sm text-neutral-600 leading-relaxed">
          To analyze documents use Study mode with TXT/MD/DOC only.
          Audio uploads happen on /upload. You can also pick an existing doc from Archive.
        </p>
        <button
          onClick={onClose}
          className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

/** -------------------- Flashcard Components -------------------- */
function FlashcardStudy({ deck, onClose }: { deck: FlashcardDeck; onClose: () => void }) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const currentCard = deck.cards[currentCardIndex];

  const handleNext = (difficulty: 'not-yet' | 'got-it') => {
    // TODO: Implement spaced repetition logic
    if (currentCardIndex < deck.cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsRevealed(false);
    } else {
      onClose(); // Study session complete
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsRevealed(!isRevealed);
      } else if (e.code === 'Digit1') {
        handleNext('not-yet');
      } else if (e.code === 'Digit2') {
        handleNext('got-it');
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isRevealed, currentCardIndex]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-w-2xl w-full rounded-xl bg-white p-8 shadow-xl">
        <div className="text-center space-y-6">
          <h3 className="text-xl font-semibold text-neutral-900">Studying: {deck.name}</h3>
          <div className="text-sm text-neutral-600">
            Card {currentCardIndex + 1} of {deck.cards.length}
          </div>
          
          <div className="space-y-4">
            <div className="text-2xl font-medium text-neutral-900 p-6 border border-neutral-200 rounded-lg min-h-[120px] flex items-center justify-center">
              {currentCard.front}
            </div>
            
            {isRevealed && (
              <div className="text-xl text-neutral-700 p-6 border border-neutral-200 rounded-lg min-h-[120px] flex items-center justify-center bg-neutral-50">
                {currentCard.back}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-center">
            {!isRevealed ? (
              <button
                onClick={() => setIsRevealed(true)}
                className="px-6 py-3 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors"
              >
                Reveal Answer
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleNext('not-yet')}
                  className="px-6 py-3 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
                >
                  Not Yet
                </button>
                <button
                  onClick={() => handleNext('got-it')}
                  className="px-6 py-3 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors"
                >
                  Got It
                </button>
              </>
            )}
          </div>

          <div className="text-xs text-neutral-500">
            Space = Reveal, 1 = Not Yet, 2 = Got It
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/** -------------------- Main Page -------------------- */
export default function ThinkSpacePage() {
  const [mode, setMode] = useState<Mode>("socratic");
  const [inputType, setInputType] = useState<InputType>("text");
  const [outputType, setOutputType] = useState<OutputType>("text");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [sessionTitle, setSessionTitle] = useState("New Session");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [flashcardDecks, setFlashcardDecks] = useState<FlashcardDeck[]>([]);
  const [currentStudyDeck, setCurrentStudyDeck] = useState<FlashcardDeck | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const messageRef = useRef<HTMLTextAreaElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag and drop prevention
  useEffect(() => {
    const preventDrop = (e: DragEvent) => {
      e.preventDefault();
      setShowModal(true);
    };

    document.addEventListener("dragover", preventDrop);
    document.addEventListener("drop", preventDrop);

    return () => {
      document.removeEventListener("dragover", preventDrop);
      document.removeEventListener("drop", preventDrop);
    };
  }, []);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages]);

  // Create new session when mode changes
  useEffect(() => {
    createNewSession();
  }, [mode, inputType, outputType]);

  const createNewSession = async () => {
    try {
      const response = await fetch("/api/thinkspace/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sessionTitle,
          mode,
          inputType,
          outputType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSession(data.session);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !currentSession) return;

    const userMessage: Message = {
      id: generateId(),
      content: message.trim(),
      isUser: true,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsProcessing(true);

    try {
      // Send message to API
      const response = await fetch("/api/thinkspace/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSession.id,
          message: userMessage.content,
          mode: currentSession.mode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, ...data.messages.slice(1)]); // Skip user message, add AI response

        // Handle voice output
        if (outputType === "voice" && data.messages[1]) {
          speak(data.messages[1].content);
        }
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message
      const errorMessage: Message = {
        id: generateId(),
        content: "Sorry, I encountered an error. Please try again.",
        isUser: false,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceInput = async () => {
    if (inputType !== "voice") return;

    try {
      setIsListening(true);
      const transcript = await startVoiceInput();
      setMessage(transcript);
      messageRef.current?.focus();
    } catch (error) {
      console.error("Voice input failed:", error);
      setMessage("Voice input not supported in this browser");
    } finally {
      setIsListening(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const exportSession = async (format: 'pdf' | 'txt') => {
    if (!currentSession) return;

    try {
      const response = await fetch("/api/thinkspace/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSession.id,
          format,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `thinkspace-session-${currentSession.id}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['text/plain', 'text/markdown', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a TXT, MD, or DOC file only.');
      return;
    }

    // TODO: Implement file processing logic
    console.log('File uploaded:', file.name);
  };

  const clearChat = () => {
    setMessages([]);
    createNewSession();
  };

  const saveToArchive = async () => {
    if (!currentSession || messages.length === 0) return;
    
    try {
      // TODO: Implement save to archive logic
      console.log('Saving session to archive...');
    } catch (error) {
      console.error('Failed to save to archive:', error);
    }
  };

  const generateShareableLink = () => {
    if (!currentSession) return;
    
    const link = `${window.location.origin}/thinkspace/share/${currentSession.id}`;
    navigator.clipboard.writeText(link);
    // TODO: Show success toast
  };

  const filteredMessages = messages.filter(msg => {
    if (!searchQuery) return true;
    return msg.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <header className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-neutral-900">ThinkSpace</h1>
        <p className="text-lg text-neutral-600">
          {mode === "socratic"
            ? "Ask questions and explore ideas through dialogue"
            : "Analyze documents and generate study materials"
          }
        </p>
      </header>

      {/* Mode Tabs */}
      <div className="flex justify-center">
        <div className="flex rounded-lg border border-neutral-200 bg-neutral-50 p-1">
          <button
            onClick={() => setMode("socratic")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "socratic"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Socratic
          </button>
          <button
            onClick={() => setMode("study")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "study"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Study
          </button>
        </div>
      </div>

      {/* Study Mode Actions */}
      {mode === "study" && (
        <div className="text-center space-y-4">
          <div className="flex gap-3 justify-center">
            <button className="inline-flex items-center rounded-lg bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 transition-colors">
              Pick from Archive
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center rounded-lg border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              Upload Document
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
          <p className="text-sm text-neutral-500">
            Allowed: TXT, MD, DOC. No audio files here.
          </p>
        </div>
      )}

      {/* Input/Output Selectors */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-neutral-700">Input:</span>
          <div className="flex rounded-lg border border-neutral-200 bg-white p-1">
            <button
              onClick={() => setInputType("text")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                inputType === "text"
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Text
            </button>
            <button
              onClick={() => setInputType("voice")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                inputType === "voice"
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Voice
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-neutral-700">Output:</span>
          <div className="flex rounded-lg border border-neutral-200 bg-white p-1">
            <button
              onClick={() => setOutputType("text")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                outputType === "text"
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Text
            </button>
            <button
              onClick={() => setOutputType("voice")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                outputType === "voice"
                  ? "bg-neutral-100 text-neutral-900"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Voice (Sage)
            </button>
          </div>
        </div>
      </div>

      {/* Content Management */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {isEditingTitle ? (
            <input
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyPress={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              className="text-lg font-medium text-neutral-900 border-b border-neutral-300 focus:outline-none focus:border-neutral-500"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="text-lg font-medium text-neutral-900 hover:text-neutral-700"
            >
              {sessionTitle}
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFlashcards(true)}
            className="px-3 py-1 text-xs border rounded-lg hover:bg-neutral-50 text-neutral-700"
          >
            Flashcards
          </button>
          <button
            onClick={clearChat}
            className="px-3 py-1 text-xs border rounded-lg hover:bg-neutral-50 text-neutral-700"
          >
            Clear Chat
          </button>
          <button
            onClick={saveToArchive}
            className="px-3 py-1 text-xs border rounded-lg hover:bg-neutral-50 text-neutral-700"
          >
            Send to Archive
          </button>
          <div className="relative">
            <button className="px-3 py-1 text-xs border rounded-lg hover:bg-neutral-50 text-neutral-700">
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 min-w-[120px]">
              <button
                onClick={() => exportSession('txt')}
                className="block w-full text-left px-3 py-1 text-xs hover:bg-neutral-50"
              >
                Export as TXT
              </button>
              <button
                onClick={() => exportSession('pdf')}
                className="block w-full text-left px-3 py-1 text-xs hover:bg-neutral-50"
              >
                Export as PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3">
        <input
          type="search"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
        />
        <button
          onClick={generateShareableLink}
          className="px-4 py-2 text-sm border rounded-lg hover:bg-neutral-50 text-neutral-700"
        >
          Share
        </button>
      </div>

      {/* Message Input */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <textarea
            ref={messageRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Sage about your topic..."
            className="flex-1 resize-none rounded-xl border border-neutral-200 p-4 text-sm placeholder-neutral-500 outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent"
            rows={4}
          />
          <div className="flex flex-col gap-2">
            {inputType === "voice" && (
              <button
                onClick={handleVoiceInput}
                disabled={isListening}
                className="h-10 w-10 rounded-lg border border-neutral-200 bg-white p-2 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                title="Start voice input"
              >
                {isListening ? "🎤" : "🎙️"}
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={!message.trim() || isProcessing}
              className="h-10 px-6 rounded-lg bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>

      {/* Sage Welcome Message */}
      {messages.length === 0 && (
        <div className="text-center space-y-4">
          <div className="max-w-2xl mx-auto p-6 bg-neutral-100 rounded-xl border border-neutral-200">
            <div className="text-lg font-medium text-neutral-900 mb-2">
              Sage: Welcome to {mode === "socratic" ? "Socratic" : "Study"} Mode
            </div>
            <p className="text-neutral-700 leading-relaxed">
              {mode === "socratic" 
                ? "I don't give quick answers, only thoughtful questions. I'll answer with questions that make you think deeper, connect ideas, and uncover what you really know. Let's sharpen your mind."
                : "Every answer pushes you forward. I'll help you unpack your materials, link concepts, and keep your learning active and engaging."
              }
            </p>
          </div>
        </div>
      )}

      {/* Transcript */}
      {messages.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-neutral-700">Conversation</h3>
          <div
            ref={transcriptRef}
            className="max-h-96 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-4 space-y-3"
          >
            {filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.isUser
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-900"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 text-neutral-900 rounded-lg px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flashcards Sidebar */}
      {showFlashcards && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-neutral-200 shadow-xl p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">Flashcards</h3>
            <button
              onClick={() => setShowFlashcards(false)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => {
                // TODO: Generate flashcards from context
                console.log('Generate from context');
              }}
              className="w-full p-3 border border-neutral-300 rounded-lg text-left hover:bg-neutral-50 transition-colors"
            >
              <div className="font-medium text-neutral-900">Generate from Context</div>
              <div className="text-sm text-neutral-600">Create cards from current session</div>
            </button>

            <button
              onClick={() => {
                // TODO: Create new deck
                console.log('Create new deck');
              }}
              className="w-full p-3 border border-neutral-300 rounded-lg text-left hover:bg-neutral-50 transition-colors"
            >
              <div className="font-medium text-neutral-900">Create New Deck</div>
              <div className="text-sm text-neutral-600">Build cards manually</div>
            </button>

            <button
              onClick={() => {
                // TODO: Study existing deck
                console.log('Study deck');
              }}
              className="w-full p-3 border border-neutral-300 rounded-lg text-left hover:bg-neutral-50 transition-colors"
            >
              <div className="font-medium text-neutral-900">Study Deck</div>
              <div className="text-sm text-neutral-600">Review your cards</div>
            </button>
          </div>
        </div>
      )}

      <SwitchModal isOpen={showModal} onClose={() => setShowModal(false)} />
      
      {currentStudyDeck && (
        <FlashcardStudy 
          deck={currentStudyDeck} 
          onClose={() => setCurrentStudyDeck(null)} 
        />
      )}
    </div>
  );
}
