// src/lib/utils/text.ts
export function takeFirstChars(s: string, max = 8000) {
  if (!s) return '';
  return s.length > max ? s.slice(0, max) : s;
}
