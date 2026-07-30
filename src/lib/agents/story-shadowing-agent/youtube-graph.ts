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
export async function runYouTubeShadowingPipeline(youtubeUrl: string, log: (msg: any) => void) {
  const steps = [
    { id: 'fetch', name: 'Tải phụ đề' },
    { id: 'consolidate', name: 'Xử lý ngữ pháp' },
    { id: 'identify', name: 'Phân tích từ vựng' },
    { id: 'enrich', name: 'Tra cứu từ điển' },
  ];

  log({
    message: "[YouTube Pipeline] Bắt đầu xử lý video...",
    progress: {
      type: 'init',
      title: '[YouTube Pipeline] Đang phân tích video...',
      steps
    }
  });
  log({
    progress: { type: 'update', stepId: 'fetch', status: 'running' }
  });

  let finalState: any = { youtubeUrl };

  const stream = await youtubeShadowingAgentGraph.stream({ youtubeUrl });

  for await (const chunk of stream) {
    if (chunk.transcriptFetcher) {
      log({
        message: "[YouTube Pipeline] 📥 Đã tải xong phụ đề (Transcript). Đang xử lý AI...",
        progress: { type: 'update', stepId: 'fetch', status: 'completed' }
      });
      log({
        message: "Đang xử lý ngữ pháp...",
        progress: { type: 'update', stepId: 'consolidate', status: 'running' }
      });
      log({
        message: "Đang nhận diện từ vựng...",
        progress: { type: 'update', stepId: 'identify', status: 'running' }
      });
      finalState = { ...finalState, ...chunk.transcriptFetcher };
    }
    if (chunk.sentenceConsolidator) {
      log({
        message: "[YouTube Pipeline] 🧩 Đã ghép câu và tạo phiên âm (IPA).",
        progress: { type: 'update', stepId: 'consolidate', status: 'completed' }
      });
      finalState = { ...finalState, ...chunk.sentenceConsolidator };
    }
    if (chunk.keywordIdentifier) {
      log({
        message: "[YouTube Pipeline] 🔍 Đã nhận diện các từ vựng/idiom khó.",
        progress: { type: 'update', stepId: 'identify', status: 'completed' }
      });
      log({
        message: "Đang tra cứu từ điển...",
        progress: { type: 'update', stepId: 'enrich', status: 'running' }
      });
      finalState = { ...finalState, ...chunk.keywordIdentifier };
    }
    if (chunk.keywordEnricher) {
      log({
        message: "[YouTube Pipeline] 🔑 Đã tra cứu từ điển và trích xuất nghĩa, word family, collocations.",
        progress: { type: 'update', stepId: 'enrich', status: 'completed' }
      });
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
