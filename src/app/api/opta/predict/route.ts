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

    const { matchId } = await request.json();
    if (!matchId) {
      return NextResponse.json({ success: false, error: "Missing matchId" }, { status: 400 });
    }

    const match = await Match.findById(matchId).lean();
    if (!match) {
      return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
    }

    // 1. Chạy AI Prediction qua LangGraph
    const predictionResult = await runOptaPrediction(
      match._id.toString(),
      match.homeTeamId.toString(),
      match.awayTeamId.toString()
    );

    if (!predictionResult) {
      throw new Error("LangGraph trả về kết quả rỗng");
    }

    // 2. Lưu vào DB Collection Predictions
    // (Upsert để đảm bảo 1 trận 1 model chỉ có 1 dự đoán)
    const modelVersion = `${process.env.GEMINI_MODEL || "gemini-2.5-flash"}@opta-v1`;
    
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
