import { z } from 'zod'

// User validation schemas
export const userSchema = z.object({
  clerkId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

// Document validation schemas
export const documentSchema = z.object({
  title: z.string().min(1).max(255),
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  fileType: z.string().min(1),
  fileUrl: z.string().url(),
})

export const documentUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  tags: z.array(z.string()).optional(),
})

// Transcript validation schemas
export const transcriptSchema = z.object({
  content: z.string().min(1),
  wordCount: z.number().positive(),
  language: z.string().default('en'),
  confidence: z.number().min(0).max(1).optional(),
  documentId: z.string().optional(),
})

// Summary validation schemas
export const summarySchema = z.object({
  content: z.string().min(1),
  type: z.enum(['academic', 'bullet_points', 'key_concepts']),
  transcriptId: z.string().min(1),
})

// Study session validation schemas
export const studySessionSchema = z.object({
  mode: z.enum(['socratic', 'study']),
  inputType: z.enum(['text', 'voice']),
  outputType: z.enum(['text', 'voice']),
  transcriptId: z.string().optional(),
})

export const studyMessageSchema = z.object({
  content: z.string().min(1),
  isUser: z.boolean(),
  sessionId: z.string().min(1),
})

// Tag validation schemas
export const tagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
})

// File upload validation schemas
export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  title: z.string().min(1).max(255),
  tags: z.array(z.string()).optional(),
})

// API request validation schemas
export const transcribeRequestSchema = z.object({
  audio: z.instanceof(File),
  language: z.string().default('en'),
})

export const summarizeRequestSchema = z.object({
  transcript: z.string().min(1),
  type: z.enum(['academic', 'bullet_points', 'key_concepts']).default('academic'),
})

export const studyRequestSchema = z.object({
  message: z.string().min(1),
  mode: z.enum(['socratic', 'study']),
  transcriptId: z.string().optional(),
})

// Search and filter schemas
export const searchSchema = z.object({
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['newest', 'oldest', 'title', 'wordCount']).default('newest'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

// Export types
export type User = z.infer<typeof userSchema>
export type Document = z.infer<typeof documentSchema>
export type DocumentUpdate = z.infer<typeof documentUpdateSchema>
export type Transcript = z.infer<typeof transcriptSchema>
export type Summary = z.infer<typeof summarySchema>
export type StudySession = z.infer<typeof studySessionSchema>
export type StudyMessage = z.infer<typeof studyMessageSchema>
export type Tag = z.infer<typeof tagSchema>
export type FileUpload = z.infer<typeof fileUploadSchema>
export type TranscribeRequest = z.infer<typeof transcribeRequestSchema>
export type SummarizeRequest = z.infer<typeof summarizeRequestSchema>
export type StudyRequest = z.infer<typeof studyRequestSchema>
export type SearchParams = z.infer<typeof searchSchema>
