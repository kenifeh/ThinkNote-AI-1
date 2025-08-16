"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Pause, RotateCcw } from "lucide-react";

export function RecordPanel({ 
  onComplete, 
  onRecordingStart 
}: { 
  onComplete: (blob: Blob) => void;
  onRecordingStart: () => void;
}) {
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [status, setStatus] = useState<"idle" | "recording" | "paused" | "stopped">("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const chunks = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    let t: any;
    if (status === "recording") {
      t = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { 
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000
      });
      
      chunks.current = [];
      mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      mr.onstop = () => onComplete(new Blob(chunks.current, { type: "audio/webm" }));
      
      // Set up audio analysis for visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Start visualization
      updateAudioLevel();
      
      mr.start();
      setRec(mr);
      setStatus("recording");
      setSeconds(0);
      onRecordingStart();
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Failed to access microphone. Please check permissions.");
    }
  };

  const updateAudioLevel = () => {
    if (analyserRef.current && status === "recording") {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average);
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  const pause = () => {
    rec?.pause();
    setStatus("paused");
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const resume = () => {
    rec?.resume();
    setStatus("recording");
    updateAudioLevel();
  };

  const stop = () => {
    rec?.stop();
    setStatus("stopped");
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const reset = () => {
    setStatus("idle");
    setSeconds(0);
    setAudioLevel(0);
    chunks.current = [];
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");

  return (
    <div className="space-y-6">
      {/* Timer - Large and Centered */}
      <div className="text-center">
        <div className="text-4xl font-mono font-bold text-gray-900 mb-2">
          {mm}:{ss}
        </div>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
          status === "recording" ? "bg-gray-100 text-gray-800" :
          status === "paused" ? "bg-gray-100 text-gray-800" :
          status === "stopped" ? "bg-gray-100 text-gray-800" :
          "bg-gray-100 text-gray-800"
        }`}>
          {status === "recording" && <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse" />}
          {status === "paused" && <div className="w-2 h-2 bg-gray-600 rounded-full" />}
          {status === "stopped" && <div className="w-2 h-2 bg-gray-600 rounded-full" />}
          {status === "idle" && <div className="w-2 h-2 bg-gray-600 rounded-full" />}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>

      {/* Audio Level Visualization */}
      {status === "recording" && (
        <div className="flex items-center justify-center gap-1 h-12">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="w-1.5 bg-gray-300 rounded-full transition-all duration-100"
              style={{
                height: `${Math.max(6, (audioLevel / 255) * 48 * (i / 20))}px`,
                backgroundColor: audioLevel > 100 ? '#6b7280' : '#d1d5db'
              }}
            />
          ))}
        </div>
      )}

      {/* Recording Controls - Large Buttons */}
      <div className="flex gap-3 justify-center">
        {status === "idle" && (
          <button
            onClick={start}
            className="px-8 py-4 rounded-xl bg-gray-900 text-white font-semibold text-lg hover:bg-gray-800 transition-colors flex items-center gap-3 shadow-lg"
          >
            <Mic size={24} />
            Start Recording
          </button>
        )}
        
        {status === "recording" && (
          <>
            <button
              onClick={pause}
              className="px-8 py-4 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold text-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              <Pause size={24} />
              Pause
            </button>
            <button
              onClick={stop}
              className="px-8 py-4 rounded-xl bg-gray-900 text-white font-semibold text-lg hover:bg-gray-800 transition-colors flex items-center gap-3 shadow-lg"
            >
              <Square size={24} />
              Stop
            </button>
          </>
        )}
        
        {status === "paused" && (
          <>
            <button
              onClick={resume}
              className="px-8 py-4 rounded-xl bg-gray-900 text-white font-semibold text-lg hover:bg-gray-800 transition-colors flex items-center gap-3 shadow-lg"
            >
              <Mic size={24} />
              Resume
            </button>
            <button
              onClick={stop}
              className="px-8 py-4 rounded-xl bg-gray-900 text-white font-semibold text-lg hover:bg-gray-800 transition-colors flex items-center gap-3 shadow-lg"
            >
              <Square size={24} />
              Stop
            </button>
          </>
        )}
        
        {status === "stopped" && (
          <button
            onClick={reset}
            className="px-8 py-4 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold text-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
          >
            <RotateCcw size={24} />
            Record Again
          </button>
        )}
      </div>

      {/* Recording Tips */}
      {status === "idle" && (
        <div className="text-center space-y-2">
          <div className="text-sm font-medium text-gray-700">Recording Tips</div>
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Speak clearly and at a normal pace</p>
            <p>• Minimize background noise</p>
            <p>• Keep a consistent distance from microphone</p>
          </div>
        </div>
      )}
    </div>
  );
}
