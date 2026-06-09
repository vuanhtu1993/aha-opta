"use client";

import { useEffect, useState } from "react";
import { MatchCard } from "./components/MatchCard";
import { Loader2, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

// Danh sách các ngày diễn ra vòng bảng World Cup 2026 (11/06 đến 24/06/2026)
const TOURNAMENT_DATES = [
  "2026-06-11", "2026-06-12", "2026-06-13", "2026-06-14", "2026-06-15",
  "2026-06-16", "2026-06-17", "2026-06-18", "2026-06-19", "2026-06-20",
  "2026-06-21", "2026-06-22", "2026-06-23", "2026-06-24"
];

export default function OptaDashboard() {
  const [selectedDate, setSelectedDate] = useState("2026-06-11");
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const dateIndex = TOURNAMENT_DATES.indexOf(selectedDate);

  useEffect(() => {
    setLoading(true);
    // Fetch các trận đấu thuộc ngày đã chọn
    fetch(`/api/opta/matches?date=${selectedDate}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMatches(data.data);
        }
      })
      .catch(err => console.error("Error fetching matches:", err))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const handlePrevDate = () => {
    if (dateIndex > 0) {
      setSelectedDate(TOURNAMENT_DATES[dateIndex - 1]);
    }
  };

  const handleNextDate = () => {
    if (dateIndex < TOURNAMENT_DATES.length - 1) {
      setSelectedDate(TOURNAMENT_DATES[dateIndex + 1]);
    }
  };

  const handleMatchUpdate = (updatedMatch: any) => {
    // Cập nhật nóng trận đấu vừa sửa trong danh sách để không cần F5
    setMatches(prev => 
      prev.map(m => m._id === updatedMatch._id ? updatedMatch : m)
    );
  };

  // Tính số lượng trận đã đá và sắp đá trong ngày
  const finishedCount = matches.filter(m => m.status === "finished").length;
  const scheduledCount = matches.filter(m => m.status === "scheduled").length;

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
            Hệ thống đánh giá sức mạnh và dự đoán bóng đá dựa trên kiến trúc LangGraph. 
            Phân tích chuyên sâu phong độ xG thực tế kết hợp chỉ số thứ hạng FIFA và tỷ lệ cược thị trường Châu Âu.
          </p>
          <div className="flex gap-4 text-sm font-mono text-emerald-500/80">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Stats</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Market Odds</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> xG Model</span>
          </div>
        </div>
      </section>

      {/* Date Navigation Slider */}
      <section className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-md shadow-black/30">
        <button
          onClick={handlePrevDate}
          disabled={dateIndex === 0 || loading}
          className="p-3 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 disabled:opacity-20 disabled:hover:bg-slate-850 transition-all active:scale-95 shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="text-center select-none">
          <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider text-indigo-400 font-bold font-mono">
            <CalendarDays className="w-3.5 h-3.5" />
            Lịch thi đấu theo ngày
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1 sm:min-w-[280px]">
            {new Date(selectedDate + "T00:00:00Z").toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric"
            })}
          </h3>
          {matches.length > 0 && (
            <div className="text-[11px] text-slate-500 mt-1 flex justify-center gap-3">
              <span>{matches.length} trận đấu</span>
              <span>•</span>
              <span className="text-emerald-500">{finishedCount} đã diễn ra</span>
              <span>•</span>
              <span className="text-slate-400">{scheduledCount} sắp diễn ra</span>
            </div>
          )}
        </div>

        <button
          onClick={handleNextDate}
          disabled={dateIndex === TOURNAMENT_DATES.length - 1 || loading}
          className="p-3 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 disabled:opacity-20 disabled:hover:bg-slate-850 transition-all active:scale-95 shrink-0"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </section>

      {/* Match List Section */}
      <section>
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : matches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map(match => (
              <MatchCard key={match._id} match={match} onUpdate={handleMatchUpdate} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
            <p className="text-slate-500 mb-2">Không có trận đấu nào diễn ra trong ngày này.</p>
            <p className="text-sm text-slate-600">Hãy chuyển sang ngày tiếp theo hoặc trước đó.</p>
          </div>
        )}
      </section>
    </div>
  );
}
