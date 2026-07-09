import { StateGraph, START, END } from "@langchain/langgraph";
import { StorybookAgentState } from "./state";
import { sentenceSplitterNode } from "./nodes/sentence-splitter.node";
import { ttsGeneratorNode } from "./nodes/tts-generator.node";

// 1. Khởi tạo Graph
const graphBuilder = new StateGraph<typeof StorybookAgentState, any, any, string>(StorybookAgentState);

// 2. Thêm Node
graphBuilder.addNode("sentenceSplitter", sentenceSplitterNode);
graphBuilder.addNode("ttsGenerator", ttsGeneratorNode);

// 3. Định nghĩa luồng: START → chia câu → tạo audio → END
graphBuilder.addEdge(START, "sentenceSplitter");
graphBuilder.addEdge("sentenceSplitter", "ttsGenerator");
graphBuilder.addEdge("ttsGenerator", END);

// 4. Compile
export const storybookAgentGraph = graphBuilder.compile();

/**
 * Public API: Chạy toàn bộ pipeline cho 1 đoạn văn bản
 */
export async function runStorybookPipeline(rawText: string, voice: string = "en-US-Journey-F") {
  const finalState = await storybookAgentGraph.invoke({ rawText, voice });

  if (finalState.error) {
    throw new Error(finalState.error);
  }

  return {
    sentences: finalState.sentences,
    level: finalState.level,
    speakingRate: finalState.speakingRate
  };
}
