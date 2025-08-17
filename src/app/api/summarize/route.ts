// src/app/api/summarize/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  getPolicyForTranscript,
  buildSummarySystemPrompt,
  buildSummaryUserPrompt,
  trimToCapBySentence,
  wordCount,
} from "@/lib/summary";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 10) {
      return NextResponse.json({ error: "Transcript too short or missing." }, { status: 400 });
    }

    const tWc = wordCount(transcript);
    const policy = getPolicyForTranscript(transcript);

    const system = buildSummarySystemPrompt(policy);
    const user = buildSummaryUserPrompt(transcript);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    let draft = (completion.choices[0]?.message?.content || "").trim();

    // Enforce hard cap via sentence-preserving trim
    let final = trimToCapBySentence(draft, policy.hardCap);

    // Absolute safety: ensure summary is shorter than transcript
    if (wordCount(final) >= tWc) {
      final = trimToCapBySentence(final, Math.max(1, tWc - 1));
    }

    // If transcript is extremely short and the model still over-expands, compress again
    if (tWc < 80 && wordCount(final) > Math.floor(tWc * 0.9)) {
      final = trimToCapBySentence(final, Math.floor(tWc * 0.9));
    }

    return NextResponse.json({
      transcriptWords: tWc,
      summaryWords: wordCount(final),
      summary: final,
      policy,
    });
  } catch (err: any) {
    console.error("SUMMARIZE_ERROR", err?.message || err);
    return NextResponse.json({ error: "Failed to summarize." }, { status: 500 });
  }
}
