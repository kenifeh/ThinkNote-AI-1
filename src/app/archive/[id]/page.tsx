"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Clock, 
  FileText, 
  Send, 
  Download, 
  Edit3, 
  Trash2, 
  Eye,
  X,
  Plus,
  Share2
} from "lucide-react";

type ArchiveItem = {
  id: string;
  title: string;
  createdAt: string;
  words: number;
  tags: string[];
  transcript: string;
  summary: string;
  audioUrl?: string | null;
  audioExpiresAt?: string | null;
};

export default function ArchiveItemPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<ArchiveItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSendToThinkSpace, setShowSendToThinkSpace] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"study" | "socratic">("study");

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (params.id) {
      fetchArchiveItem(params.id as string);
    }
  }, [params.id]);

  const fetchArchiveItem = async (id: string) => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/archive/${id}`);
      // if (!response.ok) throw new Error("Failed to fetch archive item");
      // const data = await response.json();
      
      // Mock data for now
      const mockItem: ArchiveItem = {
        id,
        title: "Introduction to Machine Learning",
        createdAt: "2024-01-15T12:00:00Z",
        words: 1250,
        tags: ["ML", "AI", "Computer Science"],
        transcript: "This is a comprehensive introduction to machine learning concepts. We'll cover the fundamentals of supervised and unsupervised learning, neural networks, and practical applications in various industries. Machine learning has become an essential tool in modern technology, enabling computers to learn from data and make predictions or decisions without being explicitly programmed for every scenario.",
        summary: "This lecture covers the fundamental concepts of machine learning, including supervised and unsupervised learning approaches, neural network architectures, and real-world applications. Key topics include data preprocessing, model training, validation techniques, and ethical considerations in AI development.",
        audioUrl: "/mock/audio-1.webm",
        audioExpiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      };
      
      setItem(mockItem);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load archive item");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleDelete = async () => {
    if (!item) return;
    
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/archive/${item.id}`, { method: "DELETE" });
      console.log("Deleting item:", item.id);
      
      // Redirect to archive list
      router.push("/archive");
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const handleSendToThinkSpace = async () => {
    if (!item) return;
    
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/archive/${item.id}/send-to-thinkspace`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ mode: selectedMode })
      // });
      
      console.log("Sending to ThinkSpace:", { itemId: item.id, mode: selectedMode });
      
      // Redirect to ThinkSpace with context
      router.push(`/thinkspace?mode=${selectedMode}&context=${item.id}`);
    } catch (err) {
      console.error("Failed to send to ThinkSpace:", err);
    }
  };

  const handleExport = async (format: "txt" | "pdf") => {
    if (!item) return;
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/archive/${item.id}/export?format=${format}`);
      // const blob = await response.blob();
      
      console.log("Exporting item:", { itemId: item.id, format });
      
      // For now, create a simple text export
      if (format === "txt") {
        const content = `${item.title}\n\nCreated: ${new Date(item.createdAt).toLocaleDateString()}\nTags: ${item.tags.join(", ")}\nWords: ${item.words}\n\nTRANSCRIPT:\n${item.transcript}\n\nSUMMARY:\n${item.summary}`;
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${item.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Failed to export item:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading archive item...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-neutral-800 mb-2">Failed to load archive item</div>
          <p className="text-neutral-700 mb-6">{error || "Item not found"}</p>
          <Link
            href="/archive"
            className="inline-block bg-neutral-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
          >
            Back to Archive
          </Link>
        </div>
      </div>
    );
  }

  const expiresIn = item.audioExpiresAt ? Math.ceil((new Date(item.audioExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60)) : null;
  const playable = !!item.audioUrl && expiresIn && expiresIn > 0;
  const expiringSoon = expiresIn && expiresIn <= 6;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header with Back Button */}
        <header className="flex items-center gap-4">
          <Link
            href="/archive"
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Archive
          </Link>
        </header>

        {/* Item Header */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-neutral-900">{item.title}</h1>
            
            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-base text-neutral-600">
              <span className="font-medium flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(item.createdAt).toLocaleDateString(undefined, { 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}
              </span>
              <span aria-hidden className="text-neutral-400">•</span>
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {item.words.toLocaleString()} words
              </span>
              <span aria-hidden className="text-neutral-400">•</span>
              <span className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-neutral-300 bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700">
                    {tag}
                  </span>
                ))}
              </span>
            </div>

            {/* Audio Player */}
            {item.audioUrl && (
              <div className="space-y-3">
                {playable ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <audio 
                        ref={audioRef}
                        src={item.audioUrl} 
                        onEnded={handleAudioEnded}
                        className="w-full h-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400"
                        preload="metadata"
                        aria-label={`Audio playback for ${item.title}`}
                      />
                    </div>
                    {expiringSoon && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Expires in {expiresIn}h
                      </span>
                    )}
                    {!expiringSoon && expiresIn && expiresIn > 6 && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 border border-green-200 flex items-center gap-1">
                        <Play className="h-4 w-4" />
                        Available for {expiresIn}h
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <span className="rounded-full bg-neutral-100 px-3 py-1 border border-neutral-200 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Audio expired
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Transcript */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-neutral-600" />
              Transcript
            </h2>
            <div className="prose prose-neutral max-w-none">
              <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
                {item.transcript}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-neutral-600" />
              Summary
            </h2>
            <div className="prose prose-neutral max-w-none">
              <p className="text-neutral-700 leading-relaxed">
                {item.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowSendToThinkSpace(true)}
              className="h-11 rounded-lg border border-neutral-300 px-4 text-base font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 transition-colors flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send to ThinkSpace
            </button>
            <button
              onClick={() => handleExport("txt")}
              className="h-11 rounded-lg border border-neutral-300 px-4 text-base font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export as TXT
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="h-11 rounded-lg border border-neutral-300 px-4 text-base font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export as PDF
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="h-11 rounded-lg border border-red-300 px-4 text-base font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition-colors flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Send to ThinkSpace Modal */}
      {showSendToThinkSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Send to ThinkSpace</h3>
            <p className="text-neutral-600 mb-4">
              Choose how you want to use this content in ThinkSpace:
            </p>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="mode"
                  value="study"
                  checked={selectedMode === "study"}
                  onChange={(e) => setSelectedMode(e.target.value as "study" | "socratic")}
                  className="text-neutral-900 focus:ring-neutral-400"
                />
                <div>
                  <div className="font-medium text-neutral-900">Study Mode</div>
                  <div className="text-sm text-neutral-600">Full transcript and summary for detailed study</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  type="radio"
                  name="mode"
                  value="socratic"
                  checked={selectedMode === "socratic"}
                  onChange={(e) => setSelectedMode(e.target.value as "study" | "socratic")}
                  className="text-neutral-900 focus:ring-neutral-400"
                />
                <div>
                  <div className="font-medium text-neutral-900">Socratic Mode</div>
                  <div className="text-sm text-neutral-600">Title and keywords for guided discussion</div>
                </div>
              </label>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowSendToThinkSpace(false)}
                className="flex-1 h-11 rounded-lg border border-neutral-300 px-4 text-base font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendToThinkSpace}
                className="flex-1 h-11 rounded-lg bg-neutral-900 px-4 text-base font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Delete Archive Item</h3>
            <p className="text-neutral-600 mb-6">
              Are you sure you want to delete "{item.title}"? This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-11 rounded-lg border border-neutral-300 px-4 text-base font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 h-11 rounded-lg bg-red-600 px-4 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
