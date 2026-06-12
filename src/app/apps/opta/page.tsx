"use client";

import { useEffect, useState } from "react";
import { MatchCard } from "./components/MatchCard";
import { Loader2, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

// Danh sách các ngày diễn ra World Cup 2026 (theo giờ Việt Nam - GMT+7)
const TOURNAMENT_DATES = [
  "2026-06-12", "2026-06-13", "2026-06-14", "2026-06-15", "2026-06-16",
  "2026-06-17", "2026-06-18", "2026-06-19", "2026-06-20", "2026-06-21",
  "2026-06-22", "2026-06-23", "2026-06-24", "2026-06-25", "2026-06-26",
  "2026-06-27", "2026-06-28", "2026-06-29", "2026-06-30", "2026-07-01",
  "2026-07-02", "2026-07-03", "2026-07-04", "2026-07-05", "2026-07-06",
  "2026-07-07", "2026-07-08", "2026-07-10", "2026-07-11", "2026-07-12",
  "2026-07-15", "2026-07-16", "2026-07-19", "2026-07-20"
];

export default function OptaDashboard() {
  const [selectedDate, setSelectedDate] = useState("2026-06-12");
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
      <section className="relative overflow-hidden rounded-[2rem] shadow-xl border border-[#121C42]/10 min-h-[400px]">
        {/* Background Shapes */}
        <div className="absolute inset-0 bg-[#3B5BDB] -z-10" />
        <div className="absolute top-0 left-0 w-[110%] h-[55%] bg-[#8DB7F4] rounded-br-[150%] sm:rounded-br-[800px] -z-10 transform -translate-x-[5%]" />
        <div className="absolute bottom-0 right-0 w-[60%] h-[60%] bg-[#121C42] rounded-tl-[150%] sm:rounded-tl-[800px] -z-10 transform translate-x-[10%] translate-y-[10%]" />
        
        <div className="relative z-10 p-8 sm:p-12 md:p-16 h-full flex flex-col justify-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
            FIFA World Cup 2026<span className="opacity-80"> | Mundial</span><br/>
            <span className="opacity-80">de Fútbol FIFA 2026</span>
          </h1>
          <h3 className="text-xl sm:text-2xl font-light text-white mb-12 opacity-90">
            Sistema de Diseño
          </h3>
          
          <div className="flex flex-col gap-1.5 text-base sm:text-lg font-medium text-white/90">
            <span>Perfiles de Equipos y Tarjetas</span>
            <span>Grupos</span>
            <span>Partidos fase de grupos</span>
            <span>Banderas</span>
          </div>
        </div>

        {/* Brand Logo placeholder from image */}
        <div className="absolute bottom-6 right-8 text-white text-2xl font-black italic mix-blend-overlay opacity-50">
          ux<span className="text-[#8DB7F4]">design</span>
        </div>
      </section>

      {/* Date Navigation Slider */}
      <section className="bg-white p-5 rounded-2xl flex items-center justify-between shadow-md border border-[#121C42]/5">
        <button
          onClick={handlePrevDate}
          disabled={dateIndex === 0 || loading}
          className="p-3 rounded-xl bg-[#f8fafc] hover:bg-[#3B5BDB]/10 text-[#121C42] border border-[#121C42]/10 hover:border-[#3B5BDB] hover:text-[#3B5BDB] disabled:opacity-30 disabled:hover:bg-[#f8fafc] disabled:hover:text-[#121C42] disabled:hover:border-[#121C42]/10 transition-all active:scale-95 shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="text-center select-none">
          <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider text-[#3B5BDB] font-bold font-mono">
            <CalendarDays className="w-3.5 h-3.5" />
            Lịch thi đấu theo ngày
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-[#121C42] mt-1 sm:min-w-[280px]">
            {new Date(selectedDate + "T00:00:00Z").toLocaleDateString("vi-VN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric"
            })}
          </h3>
          {matches.length > 0 && (
            <div className="text-[11px] text-[#121C42]/60 mt-1 flex justify-center gap-3 font-medium">
              <span>{matches.length} trận đấu</span>
              <span>•</span>
              <span className="text-[#3B5BDB]">{finishedCount} đã diễn ra</span>
              <span>•</span>
              <span className="text-[#121C42]/60">{scheduledCount} sắp diễn ra</span>
            </div>
          )}
        </div>

        <button
          onClick={handleNextDate}
          disabled={dateIndex === TOURNAMENT_DATES.length - 1 || loading}
          className="p-3 rounded-xl bg-[#f8fafc] hover:bg-[#3B5BDB]/10 text-[#121C42] border border-[#121C42]/10 hover:border-[#3B5BDB] hover:text-[#3B5BDB] disabled:opacity-30 disabled:hover:bg-[#f8fafc] disabled:hover:text-[#121C42] disabled:hover:border-[#121C42]/10 transition-all active:scale-95 shrink-0"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </section>

      {/* Match List Section */}
      <section>
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#3B5BDB] animate-spin" />
          </div>
        ) : matches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map(match => (
              <MatchCard key={match._id} match={match} onUpdate={handleMatchUpdate} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-[#121C42]/20 rounded-2xl bg-white shadow-sm">
            <p className="text-[#121C42] mb-2 text-lg font-medium">Không có trận đấu nào diễn ra trong ngày này.</p>
            <p className="text-[#121C42]/60 text-sm">Hãy chuyển sang ngày tiếp theo hoặc trước đó.</p>
          </div>
        )}
      </section>
    </div>
  );
}
