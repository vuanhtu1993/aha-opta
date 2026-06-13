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
  homeGoalsForAvg: Annotation<number>(), // Bàn thắng trung bình
  awayGoalsForAvg: Annotation<number>(),
  homeGoalsAgainstAvg: Annotation<number>(), // Bàn thua trung bình
  awayGoalsAgainstAvg: Annotation<number>(),
  homeShotsOnTargetAvg: Annotation<number>(), // Sút trúng đích trung bình
  awayShotsOnTargetAvg: Annotation<number>(),

  // 4. Elo & Expert Signal output
  eloWinProbability: Annotation<{          // Xác suất thắng theo công thức Elo
    homeProb: number;
    awayProb: number;
    drawProb: number; // Elo không tính hòa, có thể estimate
  } | null>(),
  expertOpinion: Annotation<string | null>(), // Nhận định từ chuyên gia (Internet Search)

  // 5. Predictor output
  prediction: Annotation<{               // Kết quả cuối cùng
    home: number;                        // % thắng home
    draw: number;
    away: number;
    winner: "home" | "away" | "draw";
    predictedScore: string;              // Tỉ số dự đoán (VD: "2-1")
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
