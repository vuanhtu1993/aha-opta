/**
 * POST /api/opta/predict
 *
 * Yêu cầu AI dự đoán kết quả 1 trận đấu cụ thể.
 * Chạy LangGraph OptaAgent, lưu kết quả vào DB và trả về cho client.
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { Prediction } from "@/lib/db/models/Prediction";
import { Match } from "@/lib/db/models/Match";
import { runOptaPrediction } from "@/lib/ai/opta-agent/graph";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { matchId, forceRefresh } = await request.json();
    if (!matchId) {
      return NextResponse.json({ success: false, error: "Missing matchId" }, { status: 400 });
    }

    const match = await Match.findById(matchId).lean();
    if (!match) {
      return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
    }

    const modelVersion = `${process.env.GEMINI_MODEL || "gemini-2.5-flash"}@opta-v1`;

    const isReadOnly = process.env.NEXT_PUBLIC_READ_ONLY_MODE === "true";

    // KIỂM TRA CACHE: Nếu đã có dự đoán cho version này, trả về luôn (Trừ khi forceRefresh)
    if (!forceRefresh) {
      const existingPrediction = await Prediction.findOne({ matchId: match._id, modelVersion }).lean();
      if (existingPrediction) {
        console.log(`[API] Trả về dự đoán từ DB cho trận ${matchId} (không tốn token)`);
        return NextResponse.json({ success: true, data: existingPrediction });
      }
    } else {
      if (isReadOnly) {
        return NextResponse.json({ success: false, error: "Hệ thống đang ở chế độ Read-Only" }, { status: 403 });
      }
      console.log(`[API] Force refresh dự đoán cho trận ${matchId}`);
    }

    if (isReadOnly) {
      return NextResponse.json({ success: false, error: "Hệ thống đang ở chế độ Read-Only, không thể tạo dự đoán mới" }, { status: 403 });
    }

    // 1. Chạy AI Prediction qua LangGraph
    const result = await runOptaPrediction(
      match._id.toString(),
      match.homeTeamId.toString(),
      match.awayTeamId.toString()
    );

    if (!result || !result.prediction) {
      throw new Error("LangGraph trả về kết quả rỗng");
    }

    const predictionResult = result.prediction;

    // 2. Lưu vào DB Collection Predictions
    const savedPrediction = await Prediction.findOneAndUpdate(
      { matchId: match._id, modelVersion },
      {
        $set: {
          predictedWinner: predictionResult.winner,
          predictedScore: predictionResult.predictedScore,
          probabilities: {
            home: predictionResult.home,
            draw: predictionResult.draw,
            away: predictionResult.away,
          },
          confidence: predictionResult.confidence,
          reasoning: predictionResult.reasoning,
          keyFactors: predictionResult.keyFactors,
          contextSnapshot: {
            homeFormIndex: result.homeFormIndex,
            awayFormIndex: result.awayFormIndex,
            expertOpinion: result.expertOpinion,
          }
        }
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: savedPrediction });
  } catch (error) {
    console.error("[API] POST /api/opta/predict error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal Error" },
      { status: 500 }
    );
  }
}
