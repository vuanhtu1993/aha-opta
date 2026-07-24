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
    // Phân nhỏ transcript thành các chunk để không vượt quá output token limit của Gemini (8192 tokens).
    // IPA sinh ra rất tốn token (khoảng 15 tokens/từ). Do đó, CHUNK_SIZE = 30 block là ngưỡng an toàn.
    const MAX_BLOCKS = 400;
    const CHUNK_SIZE = 30;
    const transcriptToProcess = state.rawTranscript.slice(0, MAX_BLOCKS);

    const chunkPromises = [];
    const chunkOffsets: number[] = []; // Lưu lại timeOffset của từng chunk

    for (let i = 0; i < transcriptToProcess.length; i += CHUNK_SIZE) {
      const chunk = transcriptToProcess.slice(i, i + CHUNK_SIZE);

      // Mẹo: Đưa thời gian của chunk về 0 để LLM không bị nhầm lẫn với Example Prompt (startMs: 0)
      const timeOffset = chunk[0].start;
      chunkOffsets.push(timeOffset);

      const shiftedChunk = chunk.map(c => ({
        ...c,
        start: c.start - timeOffset
      }));

      const inputText = JSON.stringify(shiftedChunk);

      chunkPromises.push(
        geminiService.invokeStructured(GeminiYoutubeConsolidatedSchema, [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: inputText },
        ], { name: `sentence_consolidation_chunk_${i / CHUNK_SIZE}` })
      );
    }

    // Chạy song song các chunk (Rate Limiter trong geminiService sẽ lo việc xếp hàng nếu cần)
    const chunkResults = await Promise.all(chunkPromises);

    let allSentences: any[] = [];
    let overallLevel = chunkResults[0]?.level || "medium";

    // Gộp kết quả, đánh lại ID và cộng trả lại timeOffset
    let currentId = 0;
    for (let i = 0; i < chunkResults.length; i++) {
      const parsed = chunkResults[i];
      const offset = chunkOffsets[i];
      for (const s of parsed.sentences) {
        s.id = currentId++;
        s.startMs += offset;
        s.endMs += offset;
        allSentences.push(s);
      }
    }

    // Xử lý hậu kỳ (Post-processing)
    // Bước 1: Nội suy (Interpolate) thời gian cho các câu có chung startMs và endMs (Thường do nằm chung 1 block phụ đề manual)
    let i = 0;
    while (i < allSentences.length) {
      let j = i;
      // Tìm các câu liên tiếp có chung startMs và endMs
      while (j < allSentences.length && allSentences[j].startMs === allSentences[i].startMs && allSentences[j].endMs === allSentences[i].endMs) {
        j++;
      }
      const count = j - i;
      if (count > 1) {
        // Phân bổ thời gian theo tỷ lệ độ dài chuỗi ký tự
        const totalDuration = allSentences[i].endMs - allSentences[i].startMs;
        let totalChars = 0;
        for (let k = i; k < j; k++) {
          totalChars += allSentences[k].text.length;
        }

        let currentStart = allSentences[i].startMs;
        for (let k = i; k < j; k++) {
          const ratio = allSentences[k].text.length / (totalChars || 1);
          const duration = totalDuration * ratio;
          allSentences[k].startMs = Math.floor(currentStart);
          allSentences[k].endMs = Math.floor(currentStart + duration);
          currentStart += duration;
        }
      }
      i = j;
    }

    // Bước 2: Sửa lỗi chồng lấn thời gian (Overlap) giữa các câu
    for (let i = 0; i < allSentences.length - 1; i++) {
      const current = allSentences[i];
      const next = allSentences[i + 1];

      // Nếu câu hiện tại lẹm vào câu tiếp theo
      if (current.endMs > next.startMs) {
        if (next.startMs > current.startMs) {
          // Chia đôi phần chồng lấn để audio mượt mà không bị hụt
          const mid = Math.floor((current.endMs + next.startMs) / 2);
          current.endMs = mid;
          next.startMs = mid;
        } else {
          // Trôi ngược thời gian (LLM sinh lỗi), ép next bắt đầu sau current
          next.startMs = current.endMs;
        }
      }
    }

    return {
      rawSentences: allSentences,
      level: overallLevel,
      sentences: allSentences, // For YouTube, rawSentences already has IPA and timestamps!
    };
  } catch (err) {
    console.error("[YouTubeSentenceConsolidator] Error:", err);
    return { error: "Không thể xử lý ngôn ngữ phụ đề. Vui lòng thử video khác ngắn hơn." };
  }
}
