import { StateGraph, START, END } from "@langchain/langgraph";
import { StorybookAgentState } from "./state";
import { sentenceSplitterNode } from "./nodes/sentence-splitter.node";
import { ttsGeneratorNode } from "./nodes/tts-generator.node";
import { keywordExtractorNode } from "./nodes/keyword-extractor.node";

// 1. Khởi tạo Graph
const graphBuilder = new StateGraph<typeof StorybookAgentState, unknown, unknown, string>(StorybookAgentState);

// 2. Thêm Node
graphBuilder.addNode("sentenceSplitter", sentenceSplitterNode);
graphBuilder.addNode("ttsGenerator", ttsGeneratorNode);
graphBuilder.addNode("keywordExtractor", keywordExtractorNode);

// 3. Định nghĩa luồng
// Từ START tẽ ra 2 nhánh song song
graphBuilder.addEdge(START, "sentenceSplitter");
graphBuilder.addEdge(START, "keywordExtractor");

// Nhánh 1: sentenceSplitter -> ttsGenerator -> END
graphBuilder.addEdge("sentenceSplitter", "ttsGenerator");
graphBuilder.addEdge("ttsGenerator", END);

// Nhánh 2: keywordExtractor -> END
graphBuilder.addEdge("keywordExtractor", END);

// 4. Compile
export const storybookAgentGraph = graphBuilder.compile();

/**
 * Public API: Chạy toàn bộ pipeline cho 1 đoạn văn bản
 */
export async function runStorybookPipeline(rawText: string, voice: string = "en-US-Journey-F", logCallback?: (msg: string) => void) {
  const finalState = await storybookAgentGraph.invoke(
    { rawText, voice },
    { configurable: { logCallback } }
  );

  if (finalState.error) {
    throw new Error(finalState.error);
  }

  return {
    sentences: finalState.sentences,
    level: finalState.level,
    speakingRate: finalState.speakingRate,
    keywords: finalState.keywords || []
  };
}
