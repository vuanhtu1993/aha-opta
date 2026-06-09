/**
 * Node 4: The Predictor (Gemini Flash)
 *
 * Nhiệm vụ:
 * Bơm tất cả data từ Node 1, 2, 3 vào prompt được cấu trúc kỹ lưỡng.
 * Yêu cầu mô hình LLM (Gemini) đóng vai trò Opta Analyst và đưa ra dự đoán.
 * Dùng Zod (Structured Output) để ép LLM trả về JSON đúng format.
 */

import { OptaStateType } from "../state";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

// 1. Định nghĩa cấu trúc JSON bắt buộc LLM phải trả về
const PredictionSchema = z.object({
  winner: z.enum(["home", "away", "draw"]),
  probabilities: z.object({
    home: z.number().min(0).max(100),
    draw: z.number().min(0).max(100),
    away: z.number().min(0).max(100),
  }),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  keyFactors: z.array(z.string()).max(5),
});

export async function predictorNode(state: OptaStateType): Promise<Partial<OptaStateType>> {
  console.log(`[LangGraph] Node 4: Gemini Predictor đang suy luận...`);

  // Khởi tạo Gemini Model (Flash cho tốc độ)
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const llm = new ChatGoogleGenerativeAI({
    model: modelName,
    temperature: 0.2, // Temperature thấp để output ổn định, phân tích logic
  });

  // Ép model trả về format JSON chuẩn Zod
  const structuredLlm = llm.withStructuredOutput(PredictionSchema);

  // 2. Chuẩn bị Context
  const home = state.homeTeamInfo;
  const away = state.awayTeamInfo;
  const market = state.marketOdds;

  const context = `
Bạn là "aha-opta", siêu máy tính dự đoán bóng đá với độ chính xác cao.
Nhiệm vụ của bạn là dự đoán kết quả trận đấu giữa ${home.name} và ${away.name}.

Dưới đây là các dữ liệu FACTS (Sự thật):

[THÔNG TIN ĐỘI BÓNG]
- HOME: ${home.name} (Hạng FIFA: ${home.fifaRanking}, Confederation: ${home.confederation})
- AWAY: ${away.name} (Hạng FIFA: ${away.fifaRanking}, Confederation: ${away.confederation})

[PHONG ĐỘ (FORM) - Dựa trên 5 trận gần nhất]
- HOME Form: ${state.homeFormIndex}/100 
  (xG trung bình: ${state.homeXgAverage}, Sức mạnh phòng thủ: ${state.homeDefRating}/100)
- AWAY Form: ${state.awayFormIndex}/100 
  (xG trung bình: ${state.awayXgAverage}, Sức mạnh phòng thủ: ${state.awayDefRating}/100)

[TÍN HIỆU THỊ TRƯỜNG (MARKET ODDS)]
${market 
  ? `Dự đoán từ các nhà cái (đã loại bỏ Vig): 
  - ${home.name} thắng: ${market.homeProb.toFixed(1)}%
  - Hòa: ${market.drawProb.toFixed(1)}%
  - ${away.name} thắng: ${market.awayProb.toFixed(1)}%` 
  : "Không có dữ liệu từ nhà cái."}

[HƯỚNG DẪN LẬP LUẬN]
1. Nếu có Tín hiệu thị trường, hãy dùng nó làm baseline. Đừng đi chệch quá xa (vd thị trường cho Home 70% thắng, bạn không nên dự đoán Away thắng trừ khi có lý do thống kê ĐẶC BIỆT mạnh).
2. Khi xG và Tín hiệu thị trường mâu thuẫn (Divergence), hãy chỉ ra sự mâu thuẫn đó trong "reasoning".
3. Lợi thế phòng thủ (Defensive Rating) thường quan trọng hơn ở các giải đấu loại trực tiếp (World Cup).

Trả về định dạng JSON nghiêm ngặt. Tổng probabilities phải = 100.
`;

  console.log("[LangGraph] Node 4: Đã gửi Prompt. Chờ Gemini response...");
  
  try {
    // 3. Gọi LLM
    const result = await structuredLlm.invoke(context);
    
    console.log(`[LangGraph] Node 4: Gemini dự đoán ${result.winner.toUpperCase()} thắng.`);

    return {
      prediction: {
        home: result.probabilities.home,
        draw: result.probabilities.draw,
        away: result.probabilities.away,
        winner: result.winner,
        confidence: result.confidence,
        reasoning: result.reasoning,
        keyFactors: result.keyFactors,
      }
    };
  } catch (error) {
    console.error("[LangGraph] Node 4: Lỗi Gemini LLM", error);
    throw new Error("Gemini Predictor failed to generate output");
  }
}
