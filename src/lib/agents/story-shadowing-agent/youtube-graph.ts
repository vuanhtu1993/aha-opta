import { StateGraph, START, END } from "@langchain/langgraph";
import { YouTubeShadowingAgentState } from "./youtube-state";
import { youtubeTranscriptFetcherNode } from "./nodes/youtube-transcript-fetcher.node";
import { youtubeSentenceConsolidatorNode } from "./nodes/youtube-sentence-consolidator.node";
import { youtubeKeywordIdentifierNode } from "./nodes/keyword-identifier.node";
import { youtubeKeywordEnricherNode } from "./nodes/keyword-enricher.node";

// 1. Khởi tạo Graph
const graphBuilder = new StateGraph<typeof YouTubeShadowingAgentState, any, any, string>(YouTubeShadowingAgentState);

// 2. Thêm Node
graphBuilder.addNode("transcriptFetcher", youtubeTranscriptFetcherNode);
graphBuilder.addNode("sentenceConsolidator", youtubeSentenceConsolidatorNode);
graphBuilder.addNode("keywordIdentifier", youtubeKeywordIdentifierNode);
graphBuilder.addNode("keywordEnricher", youtubeKeywordEnricherNode);

// 3. Định nghĩa luồng (Parallel execution)
// Fetch transcript first
graphBuilder.addEdge(START, "transcriptFetcher");

// Then branch into two parallel tasks: Consolidate sentences & Extract Keywords
graphBuilder.addEdge("transcriptFetcher", "sentenceConsolidator");
graphBuilder.addEdge("transcriptFetcher", "keywordIdentifier");

// Join branches to END
graphBuilder.addEdge("sentenceConsolidator", END);
graphBuilder.addEdge("keywordIdentifier", "keywordEnricher");
graphBuilder.addEdge("keywordEnricher", END);

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
    if (chunk.keywordIdentifier) {
      log("[YouTube Pipeline] 🔍 Đã nhận diện các từ vựng/idiom khó.");
      finalState = { ...finalState, ...chunk.keywordIdentifier };
    }
    if (chunk.keywordEnricher) {
      log("[YouTube Pipeline] 🔑 Đã tra cứu từ điển và trích xuất nghĩa, word family, collocations.");
      finalState = { ...finalState, ...chunk.keywordEnricher };
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
