"use client";

import { useState, useRef } from "react";
import { RecordPanel } from "@/components/RecordPanel";
import { 
  Play, 
  Pause, 
  Upload, 
  FileAudio, 
  Edit3, 
  Save, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function UploadPage() {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const onFile = (f: File | null) => {
    setBlob(f ? f : null);
    if (f) {
      setAudioUrl(URL.createObjectURL(f));
      setTitle(f.name.replace(/\.[^/.]+$/, "")); // Remove file extension
      setEditedTitle(f.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const onRecordComplete = (b: Blob) => {
    setBlob(b);
    setAudioUrl(URL.createObjectURL(b));
    setIsRecording(false);
    const timestamp = new Date().toLocaleString();
    setTitle(`Recording ${timestamp}`);
    setEditedTitle(`Recording ${timestamp}`);
  };

  const onRecordingStart = () => {
    setIsRecording(true);
    // Create a temporary blob for live transcription if needed
    if (!blob) {
      setTitle("Live Recording");
      setEditedTitle("Live Recording");
    }
  };

  const processAudio = async () => {
    if (!blob || !title.trim()) {
      setError("Please provide both audio file and title");
      return;
    }

    setProcessing(true);
    setError(null);
    setProcessingStep("Uploading audio file...");

    const form = new FormData();
    form.append("file", blob);
    form.append("title", title.trim());
    if (tags.trim()) {
      form.append("tags", tags.trim());
    }

    try {
      setProcessingStep("Transcribing audio...");
      const response = await fetch("/api/upload", { 
        method: "POST", 
        body: form 
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      setProcessingStep("Generating summary...");
      const data = await response.json();
      setResult(data);
      setProcessingStep("Complete!");
      
      // Auto-play the audio after processing
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }, 1000);
      
    } catch (error) {
      console.error("Error processing audio:", error);
      setError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setProcessing(false);
      setProcessingStep("");
    }
  };

  const resetForm = () => {
    setBlob(null);
    setTitle("");
    setTags("");
    setResult(null);
    setError(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setShowTranscript(false);
    setShowSummary(false);
    setIsEditingTitle(false);
    setEditedTitle("");
    setIsRecording(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
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

  const handleTitleSave = () => {
    if (editedTitle.trim()) {
      setTitle(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditedTitle(title);
    setIsEditingTitle(false);
  };

  const saveToArchive = async () => {
    // This would typically save to the archive
    // For now, just show a success message
    setResult({ ...result, saved: true });
  };

  // Check if we can show the transcription interface
  const canTranscribe = blob && title.trim();
  const isLiveRecording = isRecording && !blob;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Upload Audio</h1>
          <p className="text-gray-600">Record live lectures or upload audio files for transcription</p>
        </header>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recording Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Record Live</h2>
            <RecordPanel 
              onComplete={onRecordComplete} 
              onRecordingStart={onRecordingStart}
            />
            
            {/* Live Recording Transcription Notice */}
            {isLiveRecording && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-sm text-gray-700">
                  <div className="font-medium mb-1">🎙️ Live Recording in Progress</div>
                  <div className="text-xs text-gray-600">
                    You can start transcription once recording is complete, or continue recording for longer content.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Audio</h2>
            
            {!blob ? (
              <div className="space-y-4">
                <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                  />
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-lg font-medium text-gray-900">Drop audio or click to upload</div>
                  <div className="text-sm text-gray-500 mt-2">
                    Supports MP3, WAV, M4A, OGG (≤50MB)
                  </div>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                {/* File Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <FileAudio className="h-8 w-8 text-gray-600" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {(blob as any).name || "Recorded Audio"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(blob.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                </div>

                {/* Title Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  {!isEditingTitle ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter a descriptive title"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        required
                      />
                      <button
                        onClick={() => setIsEditingTitle(true)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        autoFocus
                      />
                      <button
                        onClick={handleTitleSave}
                        className="p-2 text-gray-600 hover:text-gray-800"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={handleTitleCancel}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <AlertCircle size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Tags Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (optional)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Enter tags separated by commas"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: machine learning, AI, computer science
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Unified Transcription Section */}
        {canTranscribe && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transcribe & Summarize</h3>
            
            {/* Audio Preview */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <FileAudio className="h-6 w-6 text-gray-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{title}</div>
                  <div className="text-xs text-gray-500">
                    {blob ? `${(blob.size / 1024 / 1024).toFixed(2)} MB` : "Recording"}
                  </div>
                </div>
              </div>
              
              {/* Process Button */}
              <button
                onClick={processAudio}
                className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                disabled={processing}
              >
                {processing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {processingStep || "Processing..."}
                  </div>
                ) : (
                  "Transcribe & Summarize"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Audio Player */}
        {audioUrl && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Audio Playback</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlayback}
                className="p-4 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <div className="flex-1">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={handleAudioEnded}
                  className="w-full"
                  controls
                />
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-4">
            {/* Transcript Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900">Transcript</h3>
                {showTranscript ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {showTranscript && (
                <div className="px-6 pb-4">
                  <textarea
                    value={result.archiveItem?.transcript || "No transcript available"}
                    readOnly
                    className="w-full h-32 rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Summary Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <button
                onClick={() => setShowSummary(!showSummary)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
                {showSummary ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {showSummary && (
                <div className="px-6 pb-4">
                  <div className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50">
                    {result.archiveItem?.summary || "No summary available"}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveToArchive}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                Save to Archive
              </button>
              <button
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Upload size={16} />
                Upload Another
              </button>
            </div>

            {/* Success Message */}
            {result.saved && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-800 font-medium">
                    Transcript and Summary saved to Archive!
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Footer Privacy Notice */}
        <footer className="text-center py-6">
          <p className="text-sm text-gray-500">
            Privacy: Raw audio is automatically deleted within 24 hours. Transcripts and summaries remain for study.
          </p>
        </footer>
      </div>
    </div>
  );
}
