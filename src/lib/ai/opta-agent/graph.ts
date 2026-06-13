/**
 * LangGraph Agent Orchestrator
 *
 * Kết nối các Node lại thành một luồng (Graph) xử lý tuần tự:
 * START -> DataFetcher -> StatsAnalyzer -> MarketSignal -> Predictor -> END
 */

import { StateGraph, START, END } from "@langchain/langgraph";
import { OptaAgentState } from "./state";
import { dataFetcherNode } from "./nodes/data-fetcher.node";
import { statsAnalyzerNode } from "./nodes/stats-analyzer.node";
import { expertOpinionNode } from "./nodes/expert-opinion.node";
import { predictorNode } from "./nodes/predictor.node";

// 1. Khởi tạo StateGraph
const graphBuilder = new StateGraph<typeof OptaAgentState, any, any, string>(OptaAgentState);

// 2. Thêm các Node vào Graph
graphBuilder.addNode("dataFetcher", dataFetcherNode);
graphBuilder.addNode("statsAnalyzer", statsAnalyzerNode);
graphBuilder.addNode("fetchExpertOpinion", expertOpinionNode);
graphBuilder.addNode("predictor", predictorNode);

// 3. Định nghĩa luồng chảy (Edges)
// Bắt đầu từ Data Fetcher
graphBuilder.addEdge(START, "dataFetcher");

// Node 1 -> Node 2
graphBuilder.addEdge("dataFetcher", "statsAnalyzer");

// Node 2 -> Node 3
graphBuilder.addEdge("statsAnalyzer", "fetchExpertOpinion");

// Node 3 -> Node 4
graphBuilder.addEdge("fetchExpertOpinion", "predictor");

// Node 4 -> Kết thúc
graphBuilder.addEdge("predictor", END);

// 4. Compile Graph
export const optaAgentGraph = graphBuilder.compile();

/**
 * Hàm Wrapper dễ sử dụng để chạy dự đoán cho 1 trận
 */
export async function runOptaPrediction(matchId: string, homeTeamId: string, awayTeamId: string) {
  console.log(`[LangGraph] Bắt đầu workflow cho Match: ${matchId}`);
  
  // Khởi tạo state ban đầu
  const initialState = {
    matchId,
    homeTeamId,
    awayTeamId,
  };

  // Kích hoạt Graph (sẽ chạy qua cả 4 nodes tuần tự)
  const finalState = await optaAgentGraph.invoke(initialState);
  
  console.log(`[LangGraph] Workflow kết thúc.`);
  
  return {
    prediction: finalState.prediction,
    homeFormIndex: finalState.homeFormIndex,
    awayFormIndex: finalState.awayFormIndex,
    expertOpinion: finalState.expertOpinion,
  };
}
