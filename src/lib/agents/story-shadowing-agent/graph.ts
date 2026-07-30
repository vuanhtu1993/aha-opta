import { StateGraph, START, END } from "@langchain/langgraph";
import { StorybookAgentState } from "./state";
import { sentenceSplitterNode } from "./nodes/sentence-splitter.node";
import { ttsGeneratorNode } from "./nodes/tts-generator.node";
import { keywordIdentifierNode } from "./nodes/keyword-identifier.node";
import { keywordEnricherNode } from "./nodes/keyword-enricher.node";

// 1. Khởi tạo Graph
const graphBuilder = new StateGraph<typeof StorybookAgentState, unknown, unknown, string>(StorybookAgentState);

// 2. Thêm Node
graphBuilder.addNode("sentenceSplitter", sentenceSplitterNode);
graphBuilder.addNode("ttsGenerator", ttsGeneratorNode);
graphBuilder.addNode("keywordIdentifier", keywordIdentifierNode);
graphBuilder.addNode("keywordEnricher", keywordEnricherNode);

// 3. Định nghĩa luồng
// Từ START tẽ ra 2 nhánh song song
graphBuilder.addEdge(START, "sentenceSplitter");
graphBuilder.addEdge(START, "keywordIdentifier");

// Nhánh 1: sentenceSplitter -> ttsGenerator -> END
graphBuilder.addEdge("sentenceSplitter", "ttsGenerator");
graphBuilder.addEdge("ttsGenerator", END);

// Nhánh 2: keywordIdentifier -> keywordEnricher -> END
graphBuilder.addEdge("keywordIdentifier", "keywordEnricher");
graphBuilder.addEdge("keywordEnricher", END);

// 4. Compile
export const storybookAgentGraph = graphBuilder.compile();

/**
 * Public API: Chạy toàn bộ pipeline cho 1 đoạn văn bản
 */
export async function runStorybookPipeline(rawText: string, voice: string = "en-US-Journey-F", logCallback?: (msg: any) => void) {
  const log = logCallback || console.log;
  const steps = [
    { id: 'split', name: 'Chia câu & Phiên âm' },
    { id: 'tts', name: 'Tạo giọng đọc (TTS)' },
    { id: 'identify', name: 'Phân tích từ vựng' },
    { id: 'enrich', name: 'Tra cứu từ điển' },
  ];

  log({
    message: "[Storybook Pipeline] Bắt đầu xử lý văn bản...",
    progress: {
      type: 'init',
      title: '[Text Pipeline] Đang xử lý đoạn văn...',
      steps
    }
  });
  log({
    message: "Đang chia câu và nhận diện từ vựng...",
    progress: { type: 'update', stepId: 'split', status: 'running' }
  });
  log({
    progress: { type: 'update', stepId: 'identify', status: 'running' }
  });

  let finalState: any = { rawText, voice };

  const stream = await storybookAgentGraph.stream({ rawText, voice });

  for await (const chunk of stream) {
    if (chunk.sentenceSplitter) {
      log({
        message: "[Storybook Pipeline] 🧩 Đã tách câu và tạo phiên âm (IPA). Đang tạo Audio...",
        progress: { type: 'update', stepId: 'split', status: 'completed' }
      });
      log({
        message: "Đang xử lý TTS...",
        progress: { type: 'update', stepId: 'tts', status: 'running' }
      });
      finalState = { ...finalState, ...chunk.sentenceSplitter };
    }
    if (chunk.ttsGenerator) {
      log({
        message: "[Storybook Pipeline] 🎧 Đã hoàn tất tạo Audio (Text-to-Speech).",
        progress: { type: 'update', stepId: 'tts', status: 'completed' }
      });
      finalState = { ...finalState, ...chunk.ttsGenerator };
    }
    if (chunk.keywordIdentifier) {
      log({
        message: "[Storybook Pipeline] 🔍 Đã nhận diện các từ vựng/idiom khó.",
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
        message: "[Storybook Pipeline] 🔑 Đã tra cứu từ điển và trích xuất nghĩa, word family, collocations.",
        progress: { type: 'update', stepId: 'enrich', status: 'completed' }
      });
      finalState = { ...finalState, ...chunk.keywordEnricher };
    }
  }

  if (finalState.error) {
    throw new Error(finalState.error);
  }

  log("[Storybook Pipeline] ✅ Xử lý hoàn tất.");

  return {
    sentences: finalState.sentences,
    level: finalState.level,
    speakingRate: finalState.speakingRate,
    keywords: finalState.keywords || []
  };
}
