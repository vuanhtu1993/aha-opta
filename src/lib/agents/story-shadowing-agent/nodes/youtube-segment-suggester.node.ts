import { z } from "zod";
import { geminiService } from "@/lib/utils/gemini";

export const SegmentSuggestionSchema = z.object({
  segments: z.array(
    z.object({
      title: z.string(),
      startMs: z.number(),
      endMs: z.number(),
      blockStart: z.number(),
      blockEnd: z.number(),
    })
  ),
});

export type SuggestedSegment = z.infer<typeof SegmentSuggestionSchema>["segments"][number];

const SYSTEM_PROMPT = `You are an expert content editor and English language teacher.
Your task is to analyze a YouTube video transcript and divide it into logical, standalone learning segments for shadowing practice.

Rules:
1. Each segment should ideally be 8 to 15 minutes long (around 80 to 150 transcript blocks).
2. Cut ONLY at natural semantic boundaries (topic changes, pause in speech, end of a thought).
3. Do NOT cut mid-sentence.
4. Give each segment a short, engaging title in English describing its content (e.g. "Part 1: Introduction to AI", "Part 2: Core Concepts").
5. Use the exact startMs of the first block in the segment and endMs (start + duration) of the last block.
6. Return blockStart (0-indexed block index) and blockEnd (inclusive 0-indexed block index).`;

export async function youtubeSegmentSuggesterNode(
  rawTranscript: Array<{ text: string; start: number; duration: number }>
): Promise<SuggestedSegment[]> {
  // Compress transcript: group every 4-5 blocks to keep prompt concise
  const compressedTranscript = rawTranscript.map((b, idx) => ({
    i: idx,
    t: Math.floor(b.start / 1000), // start time in seconds
    txt: b.text,
  }));

  const response = await geminiService.invokeStructured(
    SegmentSuggestionSchema,
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(compressedTranscript) },
    ],
    { name: "youtube_segment_suggester" }
  );

  return response.segments;
}
