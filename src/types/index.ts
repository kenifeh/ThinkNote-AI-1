export interface ArchiveItem {
  id: string
  title: string
  filename: string
  createdAt: string
  transcript: string
  summary: string
  audioMeta?: {
    url?: string
    expiryISO: string
  }
  tags?: string[]
  wordCount: number
}

export interface TranscriptionResult {
  transcript: string
  summary: string
  audioUrl?: string
  audioExpiry: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    sourceFile?: string
    context?: string
  }
}

export interface StudyContext {
  transcript: string
  summary: string
  sourceFile: string
  wordCount: number
}

export interface Flashcard {
  id: string
  question: string
  answer: string
  context?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}
