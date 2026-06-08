/**
 * LangGraph State Definition
 *
 * Định nghĩa "bộ nhớ" (State) của Agent. Nó sẽ được truyền qua lại giữa các Nodes.
 * Đây là cấu trúc dữ liệu duy nhất mà tất cả các node đều có thể đọc/ghi.
 */

import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";

// State của LangGraph phải được định nghĩa thông qua Annotation
export const OptaAgentState = Annotation.Root({
  // 1. Input parameters
  matchId: Annotation<string>(),         // ID trận đấu cần dự đoán
  homeTeamId: Annotation<string>(),      // Tách riêng để dễ debug
  awayTeamId: Annotation<string>(),

  // 2. Data Fetcher output
  homeTeamInfo: Annotation<any>(),       // Thông tin tổng quan (ranking, group)
  awayTeamInfo: Annotation<any>(),
  homeRecentMatches: Annotation<any[]>(),// 5 trận gần nhất
  awayRecentMatches: Annotation<any[]>(),
  h2hMatches: Annotation<any[]>(),       // Đối đầu trực tiếp (nếu có)

  // 3. Stats Analyzer output
  homeFormIndex: Annotation<number>(),   // Phong độ 0-100
  awayFormIndex: Annotation<number>(),
  homeXgAverage: Annotation<number>(),   // Sức mạnh tấn công (xG)
  awayXgAverage: Annotation<number>(),
  homeDefRating: Annotation<number>(),   // Sức mạnh phòng thủ
  awayDefRating: Annotation<number>(),

  // 4. Market Signal output
  marketOdds: Annotation<{               // Tín hiệu từ nhà cái
    homeProb: number;
    drawProb: number;
    awayProb: number;
    vig: number;
  } | null>(),                           // Null nếu trận đấu quá xa hoặc không có kèo

  // 5. Predictor output
  prediction: Annotation<{               // Kết quả cuối cùng
    home: number;                        // % thắng home
    draw: number;
    away: number;
    winner: "home" | "away" | "draw";
    confidence: number;                  // 0-1
    reasoning: string;
    keyFactors: string[];
  } | null>(),                           // Ban đầu là null, Node 4 sẽ điền vào

  // System/Logs (Tùy chọn)
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),      // Append new messages thay vì overwrite
  }),
});

export type OptaStateType = typeof OptaAgentState.State;
