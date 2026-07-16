import { StateGraph, START, END } from "@langchain/langgraph";
import { YouTubeShadowingAgentState } from "./youtube-state";
import { youtubeTranscriptFetcherNode } from "./nodes/youtube-transcript-fetcher.node";
import { youtubeSentenceConsolidatorNode } from "./nodes/youtube-sentence-consolidator.node";
import { youtubeKeywordExtractorNode } from "./nodes/youtube-keyword-extractor.node";

// 1. Khởi tạo Graph
const graphBuilder = new StateGraph<typeof YouTubeShadowingAgentState, any, any, string>(YouTubeShadowingAgentState);

// 2. Thêm Node
graphBuilder.addNode("transcriptFetcher", youtubeTranscriptFetcherNode);
graphBuilder.addNode("sentenceConsolidator", youtubeSentenceConsolidatorNode);
graphBuilder.addNode("keywordExtractor", youtubeKeywordExtractorNode);

// 3. Định nghĩa luồng (Parallel execution)
// Fetch transcript first
graphBuilder.addEdge(START, "transcriptFetcher");

// Then branch into two parallel tasks: Consolidate sentences & Extract Keywords
graphBuilder.addEdge("transcriptFetcher", "sentenceConsolidator");
graphBuilder.addEdge("transcriptFetcher", "keywordExtractor");

// Join branches to END
graphBuilder.addEdge("sentenceConsolidator", END);
graphBuilder.addEdge("keywordExtractor", END);

// 4. Compile
export const youtubeShadowingAgentGraph = graphBuilder.compile();

/**
 * Public API: Chạy toàn bộ pipeline cho 1 URL YouTube
 */
export async function runYouTubeShadowingPipeline(youtubeUrl: string, log: (msg: string) => void) {
  log("[YouTube Pipeline] Bắt đầu xử lý video...");
  
  let finalState: any = { youtubeUrl };

  const stream = await youtubeShadowingAgentGraph.stream({ youtubeUrl });

  for await (const chunk of stream) {
    if (chunk.transcriptFetcher) {
      log("[YouTube Pipeline] 📥 Đã tải xong phụ đề (Transcript). Đang xử lý AI...");
      finalState = { ...finalState, ...chunk.transcriptFetcher };
    }
    if (chunk.sentenceConsolidator) {
      log("[YouTube Pipeline] 🧩 Đã ghép câu và tạo phiên âm (IPA).");
      finalState = { ...finalState, ...chunk.sentenceConsolidator };
    }
    if (chunk.keywordExtractor) {
      log("[YouTube Pipeline] 🔑 Đã trích xuất xong các từ vựng quan trọng.");
      finalState = { ...finalState, ...chunk.keywordExtractor };
    }
  }

  if (finalState.error) {
    throw new Error(finalState.error);
  }

  log("[YouTube Pipeline] ✅ Phân tích hoàn tất.");

  return {
    youtubeVideoId: finalState.youtubeVideoId,
    title: finalState.title,
    sentences: finalState.sentences,
    level: finalState.level,
    keywords: finalState.keywords || [],
  };
}
