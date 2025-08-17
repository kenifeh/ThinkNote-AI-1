'use client';

import { useState } from 'react';
import { testTranscription } from '@/lib/client-api';

export default function TestTranscriptionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await testTranscription(file);
      if (response.ok) {
        setResult(response);
      } else {
        setError(response.error || 'Transcription failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Test Transcription & Summarization
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="audio" className="block text-sm font-medium text-gray-700 mb-2">
                Select Audio File
              </label>
              <input
                type="file"
                id="audio"
                accept="audio/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Test Transcription'}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* File Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">File Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span> {result.fileInfo?.name}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Size:</span> {(result.fileInfo?.size / 1024).toFixed(1)} KB
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span> {result.fileInfo?.type}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Confidence:</span> {(result.confidence * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Transcript */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Transcript</h2>
              <div className="bg-gray-50 rounded-md p-4 text-gray-800 whitespace-pre-wrap">
                {result.transcript}
              </div>
            </div>

            {/* Summary */}
            {result.summary && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Summary</h2>
                <div className="bg-blue-50 rounded-md p-4 text-blue-800 whitespace-pre-wrap">
                  {result.summary}
                </div>
              </div>
            )}

            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="text-green-800">
                <strong>Success!</strong> {result.message}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
