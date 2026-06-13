"use client";

import { useState } from "react";
import { Database, DownloadCloud, Loader2, CheckCircle2, AlertCircle, TrendingUp, FileCode2 } from "lucide-react";

type ActionType = "teams" | "matches" | "manual-2026" | "elo";

export default function SyncPage() {
  const [loading, setLoading] = useState<ActionType | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [season, setSeason] = useState("2026");

  // Hàm sync chung cho các action dùng /api/opta/sync
  const handleSync = async (type: "teams" | "matches" | "manual-2026", scrapeXg: boolean) => {
    setLoading(type);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/opta/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer opta-2026`
        },
        body: JSON.stringify({ type, scrapeXg, season: parseInt(season, 10) })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Lỗi Rate Limit: API-Football (Chưa nâng cấp gói hoặc đã hết lượt gọi).");
        }
        if (data.message && data.message.includes("subscribed")) {
          throw new Error("Lỗi API-Football: Bạn chưa Subscribe gói Basic trên RapidAPI.");
        }
        throw new Error(data.error || data.message || "Có lỗi xảy ra");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  // Hàm riêng cho Elo scraper — gọi /api/opta/scrape/elo
  const handleSyncElo = async () => {
    setLoading("elo");
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/opta/scrape/elo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer opta-2026`
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Scraper thất bại");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const isReadOnly = process.env.NEXT_PUBLIC_READ_ONLY_MODE === "true";
  const isLoading = loading !== null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Database className="text-[#3B5BDB] w-8 h-8" />
          Data Pipeline
        </h1>
        <p className="text-[#121C42]/60 mt-2">
          Quản lý luồng dữ liệu ETL (Extract, Transform, Load) từ API-Football, eloratings.net, và FBref.
        </p>
      </div>


      {isReadOnly && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">Hệ thống đang ở chế độ <strong>Read-Only</strong>. Các chức năng đồng bộ dữ liệu đã bị khóa.</p>
        </div>
      )}

      {/* Pipeline Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manual Init WC 2026 */}
        <div className="bg-gradient-to-b from-white to-[#8DB7F4]/10 border border-[#3B5BDB]/20 p-6 rounded-2xl flex flex-col justify-between shadow-lg shadow-indigo-950/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-[#3B5BDB]">Khởi tạo WC 2026</h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#3B5BDB]/10 text-[#3B5BDB] border border-[#3B5BDB]/20">API Free Bypass</span>
            </div>
            <p className="text-sm text-[#121C42]/70 mb-6">
              Tạo thủ công 48 đội tuyển (12 bảng) và sinh lịch thi đấu 72 trận vòng bảng trực tiếp vào Database mà không cần gọi API-Football.
            </p>
          </div>
          <button
            id="btn-init-wc2026"
            onClick={() => handleSync("manual-2026", false)}
            disabled={loading === "manual-2026" || isReadOnly}
            className="w-full flex items-center justify-center gap-2 bg-[#f8fafc] hover:bg-[#3B5BDB]/10 text-[#121C42] disabled:opacity-50 disabled:cursor-not-allowed hover:text-[#3B5BDB] border border-[#121C42]/10 font-medium py-3 rounded-xl transition-all"
          >
            {loading === "manual-2026" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
            Khởi tạo WC 2026
          </button>
        </div>

        {/* Sync Elo Ratings */}
        <div className="bg-gradient-to-b from-white to-[#3B5BDB]/5 border border-[#3B5BDB]/20 p-6 rounded-2xl flex flex-col justify-between shadow-lg shadow-emerald-950/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-[#3B5BDB]">Sync Elo Ratings</h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#3B5BDB]/10 text-[#3B5BDB] border border-[#3B5BDB]/20">Vercel Native</span>
            </div>
            <p className="text-sm text-[#121C42]/70 mb-1">
              Crawl hệ số <strong className="text-[#3B5BDB] font-bold">Elo</strong> từ{" "}
              <a href="https://eloratings.net" target="_blank" rel="noopener noreferrer" className="text-[#3B5BDB] font-bold hover:underline">eloratings.net</a>{" "}
              — chính xác hơn FIFA Ranking cho AI prediction.
            </p>
            <p className="text-xs text-[#121C42]/60 mb-6">
              Không cần browser, chạy trực tiếp trên Vercel serverless bằng fetch + cheerio.
            </p>
          </div>
          <button
            id="btn-sync-elo"
            onClick={handleSyncElo}
            disabled={isReadOnly || loading === "elo"}
            className="w-full flex items-center justify-center gap-2 bg-indigo-400 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-100 font-medium py-3 rounded-xl transition-colors"
          >
            {loading === "elo" ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
            {loading === "elo" ? "Đang crawl eloratings.net..." : "Sync Elo Ratings"}
          </button>
        </div>
      </div>

      {/* Result Area */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-rose-700 font-bold mb-1">Thất bại</h4>
            <p className="text-rose-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex items-start gap-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
          <div className="w-full">
            <h4 className="text-[#3B5BDB] font-bold font-bold mb-2">{result.message}</h4>
            <pre className="text-xs text-emerald-800 bg-white border border-emerald-100 p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(result.results, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
