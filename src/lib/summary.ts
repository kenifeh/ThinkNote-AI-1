// src/lib/summary.ts
export type SummaryPolicy = {
  target: number;   // target words (soft)
  hardCap: number;  // absolute max words (hard)
  mustBeShorterThan: number; // transcript words - 1 (strict)
};

export function wordCount(text: string) {
  return (text.trim().match(/\S+/g) || []).length;
}

export function getPolicyForTranscript(transcript: string): SummaryPolicy {
  const wc = wordCount(transcript);

  // Always enforce "shorter than transcript"
  const mustBeShorterThan = Math.max(1, wc - 1);

  // Very short transcripts → keep ultra-brief (never longer than source)
  if (wc < 80) {
    const target = Math.min(40, Math.floor(wc * 0.9)); // ~same ideas, but shorter
    const hardCap = Math.min(mustBeShorterThan, Math.max(20, target));
    return { target: hardCap, hardCap, mustBeShorterThan };
  }

  // Normal range → ≤35% of transcript
  if (wc <= 8000) {
    const target = Math.floor(wc * 0.35);
    // keep some safety headroom; never exceed source length
    const hardCap = Math.min(mustBeShorterThan, target);
    return { target, hardCap, mustBeShorterThan };
  }

  // Very long → ≤500 words (or 25% if that's smaller), still < transcript
  const target = Math.min(500, Math.floor(wc * 0.25));
  const hardCap = Math.min(mustBeShorterThan, target);
  return { target, hardCap, mustBeShorterThan };
}

// naive sentence splitter; swap in an NLP splitter later if needed
export function splitSentences(text: string) {
  return (
    text
      .replace(/\s+/g, " ")
      .match(/[^.!?]+[.!?]+(\s|$)/g) || [text.trim()]
  );
}

// Trim by WHOLE sentences to a maximum word cap
export function trimToCapBySentence(text: string, cap: number) {
  const sentences = splitSentences(text);
  const result: string[] = [];
  let count = 0;

  for (const s of sentences) {
    const sc = wordCount(s);
    if (count + sc > cap) break;
    result.push(s.trim());
    count += sc;
  }

  // If nothing fit (e.g., one very long sentence), hard-trim words but keep punctuation intact
  if (!result.length) {
    const words = text.trim().split(/\s+/);
    const clipped = words.slice(0, cap).join(" ");
    // try to end with a period if the last char isn't terminal
    return clipped.replace(/[^.!?]$/, "$&.");
  }

  return result.join(" ").trim();
}

export function buildSummarySystemPrompt(policy: SummaryPolicy) {
  return `
You are Sage, a study assistant for teens and young adults. Produce a clear, plain-English summary that is significantly shorter than the original transcript.

STRICT OUTPUT RULES:
- Write in plain sentences (no headings, no bullets, no lists, no labels).
- Aim for about ${policy.target} words and DO NOT exceed ${policy.hardCap} words.
- The summary MUST be shorter than the transcript.
- Do not truncate any sentence; always finish your last sentence.
- Use short sentences and simple vocabulary. Define unavoidable terms very briefly in-line.
- Focus on meaning and main claims; remove filler, repetitions, and side remarks.
- No preambles or meta text like "Here is the summary".
`;
}

export function buildSummaryUserPrompt(transcript: string) {
  return `TRANSCRIPT:\n${transcript}\n\nWrite the summary now.`;
}
