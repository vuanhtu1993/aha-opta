"use client";

import { useState } from "react";
import { ProbabilityBars } from "./ProbabilityBars";
import { BrainCircuit, Loader2 } from "lucide-react";

interface MatchCardProps {
  match: any;
}

export function MatchCard({ match }: MatchCardProps) {
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const home = match.homeTeamId;
  const away = match.awayTeamId;
  const date = new Date(match.matchDate);

  const handlePredict = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/opta/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match._id }),
      });
      const result = await res.json();
      if (result.success) {
        setPrediction(result.data);
      } else {
        setError(result.error || "Có lỗi xảy ra khi dự đoán");
      }
    } catch (err) {
      setError("Không thể kết nối đến AI Agent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all duration-300 shadow-lg shadow-black/50">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center text-xs font-medium text-slate-400">
        <span>{date.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })} - {match.stage}</span>
        {match.group && <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">Bảng {match.group}</span>}
      </div>

      {/* Teams */}
      <div className="p-5">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col items-center gap-2 w-1/3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
              {home.flag ? <img src={home.flag} alt={home.name} className="w-full h-full object-cover" /> : <span className="text-xs">{home.shortName}</span>}
            </div>
            <span className="font-bold text-center">{home.name}</span>
          </div>

          <div className="flex flex-col items-center justify-center w-1/3 text-slate-500">
            <span className="text-xs uppercase tracking-widest font-bold mb-1">VS</span>
            <span className="text-xl font-bold text-slate-300">
              {match.status === "finished" ? `${match.homeScore} - ${match.awayScore}` : "- : -"}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 w-1/3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
              {away.flag ? <img src={away.flag} alt={away.name} className="w-full h-full object-cover" /> : <span className="text-xs">{away.shortName}</span>}
            </div>
            <span className="font-bold text-center">{away.name}</span>
          </div>
        </div>

        {/* Action / Prediction Result */}
        <div className="mt-4 pt-4 border-t border-slate-800/50 min-h-[120px] flex flex-col justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center text-emerald-400 gap-3 py-4">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm font-mono animate-pulse">LangGraph Agent đang phân tích...</span>
            </div>
          ) : prediction ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <ProbabilityBars 
                homeName={home.name} 
                awayName={away.name} 
                homeProb={prediction.probabilities.home}
                drawProb={prediction.probabilities.draw}
                awayProb={prediction.probabilities.away}
              />
              
              <div className="bg-slate-950/50 p-3 rounded-lg text-sm text-slate-300 border border-emerald-900/30">
                <div className="flex gap-2 items-start">
                  <BrainCircuit className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="leading-relaxed">{prediction.reasoning}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              {error && <p className="text-rose-400 text-sm mb-3">{error}</p>}
              <button 
                onClick={handlePredict}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 text-white font-medium hover:from-emerald-500 hover:to-green-400 transition-all shadow-lg shadow-emerald-900/50 active:scale-95"
              >
                <BrainCircuit className="w-4 h-4" />
                Yêu cầu AI Dự đoán
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
