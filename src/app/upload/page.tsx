"use client";

import { useState, useRef, useEffect } from "react";
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
  AlertCircle,
  Clock,
  Tag,
  Mic,
  FileText,
  Sparkles
} from "lucide-react";

interface ProcessingResult {
  transcript: string;
  summary: string;
  wordCount: number;
  audioUrl?: string;
  saved?: boolean;
}

export default function UploadPage() {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState<string>("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [canProcess, setCanProcess] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Check if we can process audio
  useEffect(() => {
    setCanProcess(!!(blob && title.trim()));
  }, [blob, title]);

  // Auto-save to localStorage for unsaved work
  useEffect(() => {
    if (blob || title || tags) {
      localStorage.setItem('thinknote-upload-draft', JSON.stringify({
        title,
        tags,
        hasBlob: !!blob
      }));
    }
  }, [blob, title, tags]);

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem('thinknote-upload-draft');
    if (draft) {
      try {
        const { title: draftTitle, tags: draftTags } = JSON.parse(draft);
        if (draftTitle) setTitle(draftTitle);
        if (draftTags) setTags(draftTags);
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  // Warn user before leaving with unsaved work
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (blob || title.trim()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved work. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [blob, title]);

  const onFile = (f: File | null) => {
    if (f) {
      // Validate file size (50MB limit)
      if (f.size > 50 * 1024 * 1024) {
        setError("File size exceeds 50MB limit. Please choose a smaller file.");
        return;
      }

      // Validate file type
      const validTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/webm'];
      if (!validTypes.includes(f.type)) {
        setError("Invalid file type. Please upload MP3, WAV, M4A, OGG, or WebM files.");
        return;
      }

      setBlob(f);
      setAudioUrl(URL.createObjectURL(f));
      setTitle(f.name.replace(/\.[^/.]+$/, "")); // Remove file extension
      setEditedTitle(f.name.replace(/\.[^/.]+$/, ""));
      setError(null);
    } else {
      setBlob(null);
      setAudioUrl(null);
    }
  };

  const onRecordComplete = (b: Blob) => {
    setBlob(b);
    setAudioUrl(URL.createObjectURL(b));
    setIsRecording(false);
    const timestamp = new Date().toLocaleString();
    setTitle(`Recording ${timestamp}`);
    setEditedTitle(`Recording ${timestamp}`);
    setError(null);
  };

  const onRecordingStart = () => {
    setIsRecording(true);
    setLiveTranscription("");
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
    setProcessingProgress(0);
    setProcessingStep("Preparing audio...");

    try {
      // Step 1: Upload audio to storage
      setProcessingStep("Uploading audio file...");
      setProcessingProgress(20);
      
      const uploadForm = new FormData();
      uploadForm.append("file", blob);
      uploadForm.append("title", title.trim());
      if (tags.trim()) {
        uploadForm.append("tags", tags.trim());
      }

      const uploadResponse = await fetch("/api/upload", { 
        method: "POST", 
        body: uploadForm 
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const uploadData = await uploadResponse.json();
      setProcessingProgress(40);
      setProcessingStep("Transcribing audio...");

      // Step 2: Transcribe audio
      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioUrl: uploadData.audioUrl || URL.createObjectURL(blob),
          title: title.trim()
        })
      });

      if (!transcribeResponse.ok) {
        throw new Error("Transcription failed");
      }

      const transcribeData = await transcribeResponse.json();
      setProcessingProgress(70);
      setProcessingStep("Generating summary...");

      // Step 3: Generate summary
      const summaryResponse = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcribeData.transcript,
          title: title.trim()
        })
      });

      if (!summaryResponse.ok) {
        throw new Error("Summary generation failed");
      }

      const summaryData = await summaryResponse.json();
      setProcessingProgress(100);
      setProcessingStep("Complete!");

      // Calculate word count
      const wordCount = transcribeData.transcript.split(/\s+/).filter(Boolean).length;

      // Set results
      setResult({
        transcript: transcribeData.transcript,
        summary: summaryData.summary || summaryData.abstract || "Summary generated successfully",
        wordCount,
        audioUrl: uploadData.audioUrl || URL.createObjectURL(blob)
      });

      // Auto-play the audio after processing
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }, 1000);

      // Clear draft from localStorage
      localStorage.removeItem('thinknote-upload-draft');
      
    } catch (error) {
      console.error("Error processing audio:", error);
      setError(error instanceof Error ? error.message : "Processing failed");
    } finally {
      setProcessing(false);
      setProcessingStep("");
      setProcessingProgress(0);
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
    setLiveTranscription("");
    setProcessingProgress(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    localStorage.removeItem('thinknote-upload-draft');
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
    if (!result || !title.trim()) return;

    try {
      setProcessing(true);
      setProcessingStep("Saving to archive...");

      const archiveData = {
        title: title.trim(),
        tags: tags.trim() ? tags.split(',').map(t => t.trim()) : [],
        transcript: result.transcript,
        summary: result.summary,
        audioUrl: result.audioUrl,
        wordCount: result.wordCount,
        audioExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

      const response = await fetch("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(archiveData)
      });

      if (!response.ok) {
        throw new Error("Failed to save to archive");
      }

      setResult({ ...result, saved: true });
      setProcessingStep("Saved successfully!");
      
      // Clear form after successful save
      setTimeout(() => {
        resetForm();
      }, 2000);

    } catch (error) {
      console.error("Failed to save to archive:", error);
      setError("Failed to save to archive. Please try again.");
    } finally {
      setProcessing(false);
      setProcessingStep("");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mic className="h-5 w-5 text-gray-600" />
              Record Live
            </h2>
            <RecordPanel 
              onComplete={onRecordComplete} 
              onRecordingStart={onRecordingStart}
            />
            
            {/* Live Recording Status */}
            {isRecording && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-700">
                  <div className="font-medium mb-1 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    Live Recording in Progress
                  </div>
                  <div className="text-xs text-blue-600">
                    Speak clearly into your microphone. Recording will continue until you stop.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-gray-600" />
              Upload Audio
            </h2>
            
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
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>{formatFileSize(blob.size)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {blob.size > 0 ? `${Math.round(blob.size / 16000)}s` : "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Title Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
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
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
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

        {/* Processing Section */}
        {canProcess && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gray-600" />
              Process Audio
            </h3>
            
            {/* Audio Preview */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <FileAudio className="h-6 w-6 text-gray-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{title}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>{blob ? formatFileSize(blob.size) : "Recording"}</span>
                    {blob && blob.size > 0 && (
                      <>
                        <span>•</span>
                        <span>{Math.round(blob.size / 16000)}s estimated</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              {processing && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{processingStep}</span>
                    <span>{processingProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Process Button */}
              <button
                onClick={processAudio}
                className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Transcript</h3>
                  <span className="text-sm text-gray-500">({result.wordCount} words)</span>
                </div>
                {showTranscript ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {showTranscript && (
                <div className="px-6 pb-4">
                  <textarea
                    value={result.transcript}
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
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
                </div>
                {showSummary ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {showSummary && (
                <div className="px-6 pb-4">
                  <div className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50">
                    {result.summary}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveToArchive}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                disabled={processing}
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 font-medium">
                    Successfully saved to Archive! Redirecting...
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
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Dismiss
            </button>
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
