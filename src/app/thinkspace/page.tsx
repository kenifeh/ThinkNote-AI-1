"use client";

import { useEffect, useState } from "react";
import { FileText, FileDown, X } from "lucide-react";

// Types
type Mode = "socratic" | "study";
type Msg = {
  id: string;
  role: "system" | "user" | "assistant";
  tag?: string;
  content: string;
};

// Welcome Messages
const WELCOME_TEXT: Record<Mode, string> = {
  socratic:
    "I'm Sage, your teaching assistant, welcome to Socratic Mode where I don't give quick answers, only thoughtful questions. I'll answer with questions that make you think deeper, connect ideas, and uncover what you really know. Let's sharpen your mind.",
  study:
    "I'm Sage, your teaching assistant, welcome to Study Mode where every answer pushes you forward. I'll help you unpack your materials, link concepts, and keep your learning active and engaging.",
};

export default function ThinkSpace() {
  const [mode, setMode] = useState<Mode>("socratic");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [dismissed, setDismissed] = useState(false);

  // Insert welcome message only once per mode
  useEffect(() => {
    if (dismissed) return;
    const tag = `welcome_${mode}`;
    const exists = messages.some((m) => m.tag === tag);
    if (!exists) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "system",
          tag,
          content: WELCOME_TEXT[mode],
        },
      ]);
    }
  }, [mode, dismissed]);

  const addMessage = (role: "user" | "assistant", content: string) => {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role, content },
    ]);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      {/* Mode Switcher */}
      <div className="flex justify-center gap-3">
        <button
          className={`px-4 py-2 rounded-full border ${
            mode === "socratic"
              ? "bg-indigo-600 text-white"
              : "bg-white text-neutral-700"
          }`}
          onClick={() => setMode("socratic")}
        >
          Socratic
        </button>
        <button
          className={`px-4 py-2 rounded-full border ${
            mode === "study"
              ? "bg-indigo-600 text-white"
              : "bg-white text-neutral-700"
          }`}
          onClick={() => setMode("study")}
        >
          Study
        </button>
      </div>

      {/* Top Actions */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">ThinkSpace</h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm hover:bg-neutral-50">
            <FileText className="h-4 w-4" /> Export as TXT
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm hover:bg-neutral-50">
            <FileDown className="h-4 w-4" /> Export as PDF
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="space-y-4 border rounded-xl p-4 bg-neutral-50 dark:bg-neutral-900">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {m.role !== "user" && (
              <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-indigo-600 text-white grid place-items-center font-semibold">
                S
              </div>
            )}
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                m.role === "system"
                  ? "bg-indigo-50 text-indigo-800"
                  : m.role === "assistant"
                  ? "bg-white border text-neutral-800"
                  : "bg-indigo-600 text-white"
              }`}
            >
              {m.content}
              {m.tag?.startsWith("welcome_") && !dismissed && (
                <div className="mt-1 flex justify-end">
                  <button
                    className="text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
                    onClick={() => setDismissed(true)}
                  >
                    <X className="h-3 w-3" /> Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Box */}
      <div className="flex gap-2">
        <input
          placeholder={
            mode === "socratic"
              ? "Ask Sage a question to explore deeper..."
              : "Ask Sage to explain, summarize, or unpack..."
          }
          className="flex-1 border rounded-full px-4 py-2 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.currentTarget.value.trim()) {
              addMessage("user", e.currentTarget.value.trim());
              e.currentTarget.value = "";
            }
          }}
        />
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-full">
          Send
        </button>
      </div>
    </div>
  );
}
