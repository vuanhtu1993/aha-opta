"use client";

import { useState } from "react";
import { ProbabilityBars } from "./ProbabilityBars";
import { BrainCircuit, Loader2, Database } from "lucide-react";

interface MatchCardProps {
  match: any;
  onUpdate?: (updatedMatch: any) => void;
}

export function MatchCard({ match, onUpdate }: MatchCardProps) {
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // States cho Form chỉnh sửa kết quả thủ công
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [formHomeScore, setFormHomeScore] = useState(match.homeScore !== null ? String(match.homeScore) : "0");
  const [formAwayScore, setFormAwayScore] = useState(match.awayScore !== null ? String(match.awayScore) : "0");
  const [formPossession, setFormPossession] = useState(match.homeStats?.possession ? String(match.homeStats.possession) : "50");
  const [formHomeShots, setFormHomeShots] = useState(match.homeStats?.shots ? String(match.homeStats.shots) : "10");
  const [formAwayShots, setFormAwayShots] = useState(match.awayStats?.shots ? String(match.awayStats.shots) : "10");
  const [formHomeSOT, setFormHomeSOT] = useState(match.homeStats?.shotsOnTarget ? String(match.homeStats.shotsOnTarget) : "4");
  const [formAwaySOT, setFormAwaySOT] = useState(match.awayStats?.shotsOnTarget ? String(match.awayStats.shotsOnTarget) : "4");
  const [formHomeXG, setFormHomeXG] = useState(match.homeStats?.xGoals ? String(match.homeStats.xGoals) : "1.0");
  const [formAwayXG, setFormAwayXG] = useState(match.awayStats?.xGoals ? String(match.awayStats.xGoals) : "1.0");

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

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      const res = await fetch("/api/opta/matches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match._id,
          homeScore: formHomeScore,
          awayScore: formAwayScore,
          homePossession: formPossession,
          homeShots: formHomeShots,
          awayShots: formAwayShots,
          homeSOT: formHomeSOT,
          awaySOT: formAwaySOT,
          homeXG: formHomeXG,
          awayXG: formAwayXG,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setIsEditing(false);
        // Gọi callback báo cho Component cha cập nhật lại state
        if (onUpdate) {
          onUpdate(result.data);
        }
      } else {
        setFormError(result.error || "Không thể cập nhật kết quả");
      }
    } catch (err) {
      setFormError("Lỗi kết nối mạng khi cập nhật");
    } finally {
      setFormLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl overflow-hidden shadow-lg shadow-black/50">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center text-xs font-medium text-slate-400">
          <span className="font-semibold text-indigo-300">Cập nhật: {home.name} vs {away.name}</span>
          <button 
            type="button" 
            onClick={() => setIsEditing(false)} 
            className="text-slate-500 hover:text-white font-bold"
          >
            Hủy
          </button>
        </div>

        <form onSubmit={handleUpdateSubmit} className="p-5 space-y-4 text-sm">
          {/* Tỉ số */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{home.name} (Bàn thắng)</label>
              <input 
                type="number" 
                min="0" 
                value={formHomeScore}
                onChange={e => setFormHomeScore(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold text-center focus:border-indigo-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{away.name} (Bàn thắng)</label>
              <input 
                type="number" 
                min="0" 
                value={formAwayScore}
                onChange={e => setFormAwayScore(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold text-center focus:border-indigo-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Kiểm soát bóng */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
              <span>Kiểm soát: {home.name} ({formPossession}%)</span>
              <span>{away.name} ({100 - parseInt(formPossession || "50", 10)}%)</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="90" 
              value={formPossession}
              onChange={e => setFormPossession(e.target.value)}
              className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Cú sút */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{home.name} (Tổng sút / Trúng đích)</label>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="number" 
                  min="0"
                  placeholder="Sút"
                  value={formHomeShots}
                  onChange={e => setFormHomeShots(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-center text-xs text-white focus:border-indigo-500 outline-none"
                  required
                />
                <input 
                  type="number" 
                  min="0"
                  placeholder="Trúng"
                  value={formHomeSOT}
                  onChange={e => setFormHomeSOT(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-center text-xs text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{away.name} (Tổng sút / Trúng đích)</label>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="number" 
                  min="0"
                  placeholder="Sút"
                  value={formAwayShots}
                  onChange={e => setFormAwayShots(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-center text-xs text-white focus:border-indigo-500 outline-none"
                  required
                />
                <input 
                  type="number" 
                  min="0"
                  placeholder="Trúng"
                  value={formAwaySOT}
                  onChange={e => setFormAwaySOT(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-center text-xs text-white focus:border-indigo-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Bàn thắng kỳ vọng xG */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{home.name} xG thực</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={formHomeXG}
                onChange={e => setFormHomeXG(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-center focus:border-indigo-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">{away.name} xG thực</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={formAwayXG}
                onChange={e => setFormAwayXG(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-center focus:border-indigo-500 outline-none"
                required
              />
            </div>
          </div>

          {formError && <p className="text-rose-400 text-xs">{formError}</p>}

          <div className="flex gap-2 pt-2">
            <button 
              type="button" 
              onClick={() => setIsEditing(false)}
              className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-xl text-center"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={formLoading}
              className="w-1/2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2 rounded-xl flex items-center justify-center gap-1.5"
            >
              {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Lưu kết quả
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all duration-300 shadow-lg shadow-black/50">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center text-xs font-medium text-slate-400">
        <span>{date.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })} - {match.stage}</span>
        <div className="flex items-center gap-2">
          {match.group && <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">Bảng {match.group}</span>}
          <button
            onClick={() => setIsEditing(true)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 border border-slate-700 text-[10px]"
          >
            Cập nhật kết quả
          </button>
        </div>
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
                  <p className="leading-relaxed text-xs">{prediction.reasoning}</p>
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
