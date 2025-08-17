'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Deck, Message, Mode, StudyDoc } from '@/types/thinkspace';
import ExportDropdown from '@/components/thinkspace/ExportDropdown';

const WELCOME = {
  socratic:
    "I'm Sage, your teaching assistant, welcome to Socratic Mode where I don't give quick answers, only thoughtful questions. I'll answer with questions that make you think deeper, connect ideas, and uncover what you really know. Let's sharpen your mind.",
  study:
    "I'm Sage, your teaching assistant, welcome to Study Mode where every answer pushes you forward. I'll help you unpack your materials, link concepts, and keep your learning active and engaging.",
};

function isoNow() {
  return new Date().toISOString();
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function ThinkSpacePage() {
  const [mode, setMode] = useState<Mode>('socratic');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Study mode: document/transcript viewer
  const [studyDoc, setStudyDoc] = useState<StudyDoc | null>(null);

  // Sessions (very small MVP local list)
  const [sessions, setSessions] = useState<{ id: string; title: string }[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('new');

  // Flashcards panel visibility
  const [showFlashcards, setShowFlashcards] = useState(false);

  // Export actions
  const handleExport = async (type: 'txt' | 'pdf') => {
    if (type === 'txt') {
      const text = messages.map(m => `[${m.role}] ${m.text}`).join('\n\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `thinkspace-${Date.now()}.txt`;
      a.click();
    } else {
      // Client-only TXT fallback (you can wire a server PDF later)
      const text = messages.map(m => `[${m.role}] ${m.text}`).join('\n\n');
      const blob = new Blob([text], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `thinkspace-${Date.now()}.txt`;
      a.click();
    }
  };

  // On mode change, inject Sage welcome bubble (once per session)
  useEffect(() => {
    setMessages(prev => {
      if (prev.some(m => m.text === WELCOME[mode])) return prev;
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'sage',
          text: WELCOME[mode],
          createdAt: isoNow(),
        },
      ];
    });
  }, [mode]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setIsSending(true);

    // push user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
      createdAt: isoNow(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // call your Socratic/Study back-end (replace with your real APIs)
    const endpoint =
      mode === 'socratic' ? '/api/socratic/reply' : '/api/study/reply';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          text: trimmed,
          context: mode === 'study' ? studyDoc?.content ?? '' : '',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      const sageMsg: Message = {
        id: crypto.randomUUID(),
        role: 'sage',
        text: data.reply,
        createdAt: isoNow(),
      };
      setMessages(prev => [...prev, sageMsg]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'sage',
        text: 'Sorry, I encountered an error. Please try again.',
        createdAt: isoNow(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleUploadDocument = () => {
    // Trigger file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.txt,.md,.doc,.docx';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setStudyDoc({
          id: crypto.randomUUID(),
          title: file.name,
          content: content,
        });
      };
      reader.readAsText(file);
    };
    fileInput.click();
  };

  const handlePickFromArchive = () => {
    // For now, create a sample document - replace with real archive picker
    const sampleDoc: StudyDoc = {
      id: crypto.randomUUID(),
      title: 'Sample Transcript',
      content: 'This is a sample transcript/summary. Replace with real archive content…',
    };
    setStudyDoc(sampleDoc);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const openFlashcards = () => {
    setShowFlashcards(true);
  };

  return (
    <main className="min-h-[calc(100svh-64px)]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        {/* Title */}
        <header className="text-center mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">ThinkSpace</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your AI‑powered study companion for deeper learning
          </p>
        </header>

        {/* Mode toggle */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={() => setMode('socratic')}
            className={`rounded-full px-4 py-2 text-sm border transition ${
              mode === 'socratic'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
            aria-pressed={mode === 'socratic'}
          >
            Socratic Mode
          </button>
          <button
            onClick={() => setMode('study')}
            className={`rounded-full px-4 py-2 text-sm border transition ${
              mode === 'study'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
            aria-pressed={mode === 'study'}
          >
            Study Mode
          </button>
        </div>

        {/* Actions row */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
          <button
            onClick={handleUploadDocument}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            Upload Document
          </button>
          <button
            onClick={handlePickFromArchive}
            className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Pick from Archive
          </button>
        </div>
        <p className="text-center text-xs text-gray-500 mb-6">
          Allowed: TXT, MD, DOC/DOCX. No audio files here.
        </p>

        {/* Layout: left document viewer + right chat */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LEFT: Document / Context Pane */}
          <div className="rounded-lg border border-gray-200">
            <div className="border-b border-gray-100 p-3">
              <h2 className="text-sm font-medium">Document</h2>
            </div>
            <div className="p-4">
              {studyDoc ? (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{studyDoc.title}</h3>
                  <div className="h-[400px] overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-gray-700 bg-gray-50 rounded-md p-3">
                    {studyDoc.content}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  No document selected
                  <div className="mt-2 rounded-md border border-dashed border-gray-200 p-6 text-center">
                    <p className="text-gray-500">
                      Pick from Archive or upload a document (TXT, MD, DOC/DOCX).
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Chat Pane */}
          <div className="rounded-lg border border-gray-200">
            {/* Chat Header */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-3">
              <label className="text-xs text-gray-500">Session</label>
              <select
                value={activeSessionId}
                onChange={(e) => setActiveSessionId(e.target.value)}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700"
              >
                <option value="new">New</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={handleClearChat}
                  className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Clear Chat
                </button>

                <ExportDropdown onExport={handleExport} />

                <button
                  onClick={openFlashcards}
                  className="rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white hover:bg-gray-800"
                >
                  Flashcards
                </button>
              </div>
            </div>

            {/* Messages list */}
            <div className="h-[420px] overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    m.role === 'user'
                      ? 'ml-auto bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="leading-relaxed">{m.text}</div>
                  <div
                    className={`mt-1 text-[10px] ${
                      m.role === 'user' ? 'text-gray-300' : 'text-gray-500'
                    }`}
                  >
                    {fmtTime(m.createdAt)}
                  </div>
                </div>
              ))}
            </div>

            {/* Composer */}
            <div className="border-t border-gray-100 p-3">
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <input
                  type="text"
                  placeholder="Ask Sage about your topic…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-300"
                />
                <button
                  type="submit"
                  disabled={isSending}
                  className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  {isSending ? 'Sending…' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>

      {/* Flashcards Panel (drawer style) */}
      {showFlashcards && (
        <FlashcardsPanel
          mode={mode}
          context={mode === 'study' ? studyDoc?.content ?? '' : ''}
          onClose={() => setShowFlashcards(false)}
        />
      )}
    </main>
  );
}

/** FLASHCARDS PANEL (inline for brevity) */
function FlashcardsPanel({
  mode,
  context,
  onClose,
}: {
  mode: 'socratic' | 'study';
  context: string;
  onClose: () => void;
}) {
  const [view, setView] = useState<'list' | 'study' | 'create'>('list');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);

  // Create deck
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');

  const loadDecks = async () => {
    const res = await fetch('/api/flashcards/decks');
    const data = await res.json();
    setDecks(data.decks ?? []);
  };

  useEffect(() => {
    loadDecks().catch(() => {});
  }, []);

  const generateFromContext = async () => {
    if (!context) {
      alert('No context found. Load a transcript or summary in Study Mode.');
      return;
    }
    const res = await fetch('/api/flashcards/generate', {
      method: 'POST',
      body: JSON.stringify({ context }),
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    await loadDecks();
    alert(`Generated ${data.cards?.length ?? 0} cards into "${data.deckTitle}"`);
  };

  const createDeck = async () => {
    const body = {
      title: title || 'Untitled Deck',
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    const res = await fetch('/api/flashcards/decks', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
    await loadDecks();
    setView('list');
    setTitle('');
    setTags('');
  };

  const startStudy = (deck: Deck) => {
    setActiveDeck(deck);
    setView('study');
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/20">
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Flashcards</h3>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
            Close
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-4">
          <button
            onClick={() => setView('list')}
            className={`rounded-xl px-4 py-3 text-base font-medium transition-colors ${
              view === 'list' ? 'bg-gray-900 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:text-gray-900'
            }`}
          >
            Decks
          </button>
          <button
            onClick={() => setView('create')}
            className={`rounded-xl px-4 py-3 text-base font-medium transition-colors ${
              view === 'create' ? 'bg-gray-900 text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:text-gray-900'
            }`}
          >
            New Deck
          </button>
          <button
            onClick={generateFromContext}
            className="ml-auto rounded-xl bg-gray-900 px-4 py-3 text-base font-medium text-white shadow-sm disabled:opacity-60"
            disabled={!context}
            title={
              context
                ? 'Generate from current Study context'
                : 'Load a document in Study mode'
            }
          >
            Generate from Context
          </button>
        </div>

        {/* Views */}
        {view === 'list' && (
          <div className="p-6 space-y-4">
            {decks.length === 0 && (
              <div className="text-base text-gray-500 text-center py-8">
                No decks yet. Generate from context or create one.
              </div>
            )}
            {decks.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
              >
                <div>
                  <div className="font-semibold text-gray-900 mb-1">{d.title}</div>
                  <div className="text-sm text-gray-500">
                    {d.tags?.length ? d.tags.join(' • ') : 'No tags'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startStudy(d)}
                    className="btn-primary"
                  >
                    Study
                  </button>
                  <button
                    onClick={async () => {
                      await fetch(`/api/flashcards/decks/${d.id}`, {
                        method: 'DELETE',
                      });
                      await fetch('/api/flashcards/decks/cleanup', {
                        method: 'POST',
                      }).catch(() => {});
                      await loadDecks();
                    }}
                    className="btn-secondary"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'create' && (
          <div className="p-6 space-y-4">
            <label className="block text-base font-medium text-gray-700">
              Title
              <input
                className="input-field mt-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Newton's Laws"
              />
            </label>
            <label className="block text-base font-medium text-gray-700">
              Tags (comma separated)
              <input
                className="input-field mt-2"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="physics, mechanics"
              />
            </label>
            <button
              onClick={createDeck}
              className="btn-primary w-full"
            >
              Create
            </button>
          </div>
        )}

        {view === 'study' && activeDeck && (
          <StudyDeck deck={activeDeck} onExit={() => setView('list')} />
        )}
      </div>
    </div>
  );
}

/** STUDY VIEW (spaced-recall lite) */
function StudyDeck({ deck, onExit }: { deck: Deck; onExit: () => void }) {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const card = deck.cards[idx];

  const next = () => {
    setRevealed(false);
    setIdx((i) => (i + 1) % Math.max(deck.cards.length, 1));
  };

  if (!card) {
    return (
      <div className="p-6">
        <div className="text-base text-gray-500 text-center py-8">No cards to study.</div>
        <button onClick={onExit} className="btn-secondary mt-4 w-full">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 text-sm text-gray-500 text-center">
        Deck: {deck.title} • {idx + 1} / {deck.cards.length}
      </div>
      <div className="rounded-xl border border-gray-200 p-6 mb-6">
        <div className="text-lg text-gray-900 mb-6 font-medium">{card.q}</div>
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="btn-primary w-full"
          >
            Reveal Answer
          </button>
        ) : (
          <div>
            <div className="mb-6 rounded-xl bg-gray-50 p-4 text-base text-gray-800 leading-relaxed">
              {card.a}
            </div>
            <div className="flex gap-3">
              <button
                onClick={next}
                className="btn-secondary flex-1"
                title="Not yet"
              >
                Not yet
              </button>
              <button
                onClick={next}
                className="btn-primary flex-1"
                title="Got it"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>

      <button onClick={onExit} className="btn-secondary w-full">
        Back to Decks
      </button>
    </div>
  );
}
