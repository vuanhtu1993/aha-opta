"use client";

import { useEffect, useState } from "react";
import { MatchCard } from "./components/MatchCard";
import { Loader2 } from "lucide-react";

export default function OptaDashboard() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch upcoming/scheduled matches
    fetch("/api/opta/matches?limit=10")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMatches(data.data);
        }
      })
      .catch(err => console.error("Error fetching matches:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-4 tracking-tight">
            AI World Cup Predictor
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed mb-6">
            Hệ thống phân tích bóng đá mạnh mẽ dựa trên kiến trúc LangGraph. 
            Kết hợp mô hình <strong className="text-emerald-400">Gemini 2.5 Flash</strong>, dữ liệu phong độ xG thực tế, 
            và tín hiệu từ thị trường cá cược Châu Âu.
          </p>
          <div className="flex gap-4 text-sm font-mono text-emerald-500/80">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Stats</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Market Odds</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> xG Model</span>
          </div>
        </div>
      </section>

      {/* Match List Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Trận đấu sắp diễn ra
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : matches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map(match => (
              <MatchCard key={match._id} match={match} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
            <p className="text-slate-500 mb-2">Chưa có dữ liệu trận đấu.</p>
            <p className="text-sm text-slate-600">Hãy chạy Data Pipeline (ETL) để tải dữ liệu về.</p>
          </div>
        )}
      </section>
    </div>
  );
}
