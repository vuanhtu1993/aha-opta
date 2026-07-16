import { z } from "zod";
import { YouTubeShadowingStateType } from "../youtube-state";
import { geminiService } from "@/lib/utils/gemini";

const GeminiYoutubeConsolidatedSchema = z.object({
  level: z.enum(["easy", "medium", "hard"]),
  sentences: z.array(
    z.object({
      id: z.number(),
      text: z.string(),
      startMs: z.number(),
      endMs: z.number(),
      words: z.array(
        z.object({
          word: z.string(),
          ipa: z.string(),
        })
      ),
    })
  ),
});

const SYSTEM_PROMPT = `You are an expert linguist and audio synchronizer.
The user will provide a raw transcript array from a YouTube video where each item is a caption block with 'text', 'start' (in ms) and 'duration' (in ms).
These blocks are often broken mid-sentence.

Your task:
1. Merge the blocks into complete, grammatically correct English sentences.
2. For each merged sentence, calculate:
   - startMs: the 'start' value of the VERY FIRST block in that sentence.
   - endMs: the ('start' + 'duration') value of the VERY LAST block in that sentence.
3. For each sentence, provide phonetic transcription (IPA) for EVERY word in the sentence as an array of { word, ipa }. Use broad IPA transcription. Attach punctuation to the preceding word.
4. Classify the overall language difficulty of the text into "easy", "medium", or "hard".
   - easy: A1-A2, short sentences, basic vocabulary.
   - medium: B1-B2, some idioms, complex sentences.
   - hard: C1+, technical jargon, advanced grammar.

Output EXACTLY a JSON matching this schema:
{
  "level": "medium",
  "sentences": [
    {
      "id": 0,
      "text": "This is a merged sentence.",
      "startMs": 0,
      "endMs": 4000,
      "words": [{"word": "This", "ipa": "/ðɪs/"}, {"word": "is", "ipa": "/ɪz/"}, ...]
    }
  ]
}

CRITICAL RULE:
Do NOT paraphrase the text. Keep the exact original words, just fix the punctuation and capitalization to form proper sentences.
Do NOT lose any audio gap, endMs MUST be the exact end time of the last block forming the sentence.`;

export async function youtubeSentenceConsolidatorNode(
  state: YouTubeShadowingStateType
): Promise<Partial<YouTubeShadowingStateType>> {
  if (state.error || !state.rawTranscript) return {};

  try {
    // Only send up to 100 blocks to avoid token limits / timeouts
    const transcriptSubset = state.rawTranscript.slice(0, 80);
    const inputText = JSON.stringify(transcriptSubset);

    const parsed = await geminiService.invokeStructured(GeminiYoutubeConsolidatedSchema, [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: inputText },
    ], { name: "sentence_consolidation" });

    const sentences = parsed.sentences;

    // Xử lý hậu kỳ (Post-processing): Sửa lỗi chồng lấn thời gian do phụ đề tự động (ASR) của YouTube
    for (let i = 0; i < sentences.length - 1; i++) {
      const current = sentences[i];
      const next = sentences[i + 1];

      // Nếu câu hiện tại có thời gian kết thúc lẹm vào thời gian bắt đầu của câu tiếp theo
      if (current.endMs > next.startMs) {
        // Ép thời gian kết thúc bằng đúng lúc câu tiếp theo bắt đầu
        current.endMs = next.startMs;
      }
    }

    return {
      rawSentences: sentences,
      level: parsed.level,
      sentences: sentences, // For YouTube, rawSentences already has IPA and timestamps!
    };
  } catch (err) {
    console.error("[YouTubeSentenceConsolidator] Error:", err);
    return { error: "Không thể xử lý ngôn ngữ phụ đề. Vui lòng thử video khác ngắn hơn." };
  }
}
