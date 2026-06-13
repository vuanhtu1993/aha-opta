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
  predictedScore: z.string().describe("Tỉ số dự đoán của trận đấu, ví dụ: '2-1', '0-0', '1-3'"),
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
  const eloProb = state.eloWinProbability;
  const expertOpinion = state.expertOpinion;

  const context = `
Bạn là "aha-opta", siêu máy tính dự đoán bóng đá với độ chính xác cao.
Nhiệm vụ của bạn là dự đoán kết quả trận đấu bằng tiếng việt giữa ${home.name} và ${away.name}, bao gồm cả dự đoán tỉ số chính xác.

Dưới đây là các dữ liệu FACTS (Sự thật):

[THÔNG TIN ĐỘI BÓNG]
- HOME: ${home.name} (Hạng FIFA: ${home.fifaRanking}, Elo Rating: ${home.eloRating ?? "N/A"}, Hạng Elo: ${home.eloRank ?? "N/A"}, Confederation: ${home.confederation})
- AWAY: ${away.name} (Hạng FIFA: ${away.fifaRanking}, Elo Rating: ${away.eloRating ?? "N/A"}, Hạng Elo: ${away.eloRank ?? "N/A"}, Confederation: ${away.confederation})

[PHONG ĐỘ (FORM) - Đánh giá từ các trận đã đấu gần đây, trọng số ưu tiên trận gần nhất]
- HOME Form: ${state.homeFormIndex}/100 (Tính trên ${state.homeRecentMatches?.length || 0} trận gần nhất)
  (Ghi bàn TB: ${state.homeGoalsForAvg}, Lọt lưới TB: ${state.homeGoalsAgainstAvg}, Sút trúng đích TB: ${state.homeShotsOnTargetAvg})
- AWAY Form: ${state.awayFormIndex}/100 (Tính trên ${state.awayRecentMatches?.length || 0} trận gần nhất)
  (Ghi bàn TB: ${state.awayGoalsForAvg}, Lọt lưới TB: ${state.awayGoalsAgainstAvg}, Sút trúng đích TB: ${state.awayShotsOnTargetAvg})

[XÁC SUẤT CHIẾN THẮNG (Dựa trên Elo Rating)]
${eloProb
      ? `- ${home.name} thắng: ${eloProb.homeProb.toFixed(1)}%
  - Hòa: ${eloProb.drawProb.toFixed(1)}%
  - ${away.name} thắng: ${eloProb.awayProb.toFixed(1)}%`
      : "Không có dữ liệu xác suất Elo."}

[Ý KIẾN CHUYÊN GIA]
${expertOpinion ? expertOpinion : "Không có nhận định nào từ chuyên gia."}

[HƯỚNG DẪN LẬP LUẬN & DỰ ĐOÁN TỈ SỐ]
1. Sử dụng "Xác suất chiến thắng theo Elo" làm Baseline (Điểm neo chính). 
2. Hãy điều chỉnh tỷ lệ này dựa trên Thống kê truyền thống: 
   - Đội nào có khả năng dứt điểm trúng đích (Sút trúng đích TB) và hiệu số Bàn thắng/Bàn thua vượt trội, hãy cộng thêm 5-10% cơ hội thắng.
   - CHÚ Ý: Nếu Form Index chỉ được tính trên 1-2 trận đấu, hãy xem đây là mẫu (sample size) rất nhỏ và ĐỪNG đánh giá quá cao phong độ này. Hãy dựa nhiều hơn vào Elo Rating và Ý kiến chuyên gia.
3. Trong các giải đấu loại trực tiếp hoặc nếu chênh lệch Elo nhỏ (<50 điểm), sức mạnh phòng ngự (Lọt lưới TB thấp) là yếu tố quyết định.
4. Tham khảo thêm Ý KIẾN CHUYÊN GIA để đưa ra nhận định cuối cùng chân thực và đa chiều hơn.
5. DỰ ĐOÁN TỈ SỐ: Dựa vào số "Ghi bàn TB" và "Lọt lưới TB" của 2 đội, kết hợp với phong độ phòng ngự, hãy suy luận ra một tỉ số khả dĩ nhất (ví dụ: 2-1, 0-0, 1-1). Nếu 2 đội đều có Ghi bàn TB cao, tỉ số có thể nhiều bàn thắng. NẾU dự đoán đội X thắng, tỉ số bắt buộc phải phản ánh đội X thắng.
6. FORMAT REASONING: Trong phần giải thích (reasoning), BẮT BUỘC sử dụng markdown **in đậm** cho TẤT CẢ các con số thống kê quan trọng (ví dụ: **50%**, **1.5 bàn**, **2-1**) để làm nổi bật thông tin.

Trả về định dạng JSON nghiêm ngặt. Tổng probabilities (home + draw + away) bắt buộc phải = 100.
`;

  console.log("[LangGraph] Node 4: Đã gửi Prompt. Chờ Gemini response...");

  try {
    // 3. Gọi LLM
    const result = await structuredLlm.invoke(context);

    console.log(`[LangGraph] Node 4: Gemini dự đoán ${result.winner.toUpperCase()} thắng. Tỉ số: ${result.predictedScore}`);

    return {
      prediction: {
        home: result.probabilities.home,
        draw: result.probabilities.draw,
        away: result.probabilities.away,
        winner: result.winner,
        predictedScore: result.predictedScore,
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
