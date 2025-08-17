// types/thinkspace.ts
export type Mode = 'socratic' | 'study';

export type Role = 'user' | 'sage';

export interface Message {
  id: string;
  role: Role;
  text: string;
  createdAt: string; // ISO string
}

export interface Flashcard {
  id: string;
  q: string;
  a: string;
  dueAt?: string; // ISO
}

export interface Deck {
  id: string;
  title: string;
  tags: string[];
  cards: Flashcard[];
  nextReviewAt?: string; // ISO
}

export interface StudyDoc {
  id: string;
  title: string;
  content: string; // plain text (from transcript/summary)
}
