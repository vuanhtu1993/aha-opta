"use client";

import { useState } from "react";
import { Database, DownloadCloud, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function SyncPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [season, setSeason] = useState("2026");

  const handleSync = async (type: "teams" | "matches" | "all", scrapeXg: boolean) => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/opta/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer opta-2026` // Hardcoded secret từ .env để tiện demo (trong thực tế nên dùng auth context)
        },
        body: JSON.stringify({ type, scrapeXg, season: parseInt(season, 10) })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("Lỗi Rate Limit: API-Football (Chưa nâng cấp gói hoặc đã hết lượt gọi).");
        }
        if (data.message && data.message.includes("subscribed")) {
          throw new Error("Lỗi API-Football: Bạn chưa Subscribe gói Basic trên RapidAPI. Vào RapidAPI -> API-Football -> Subscribe gói free.");
        }
        throw new Error(data.error || data.message || "Có lỗi xảy ra");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Database className="text-emerald-500 w-8 h-8" />
          Data Pipeline
        </h1>
        <p className="text-slate-400 mt-2">
          Quản lý luồng dữ liệu ETL (Extract, Transform, Load) từ API-Football, The Odds API, và FBref.
        </p>
      </div>

      {/* Season Selector */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-200">Mùa giải World Cup</h3>
          <p className="text-xs text-slate-400 mt-1">
            Chọn 2026 cho giải đấu hiện tại hoặc 2022 để kiểm thử mô hình với dữ liệu lịch sử đầy đủ.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {["2026", "2022"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeason(s)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                season === s
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
            >
              World Cup {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sync Teams */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">Đồng bộ Đội bóng</h3>
            <p className="text-sm text-slate-400 mb-6">
              Lấy danh sách 48 đội bóng tham gia, thông tin quốc gia, logo, và bảng đấu. (API-Football)
            </p>
          </div>
          <button
            onClick={() => handleSync("teams", false)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <DownloadCloud className="w-5 h-5" />}
            Sync Teams
          </button>
        </div>

        {/* Sync Matches */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-200 mb-2">Đồng bộ Trận đấu</h3>
            <p className="text-sm text-slate-400 mb-6">
              Lấy lịch thi đấu, kết quả, thống kê (shots, possession) và tự động cào xG từ FBref.
            </p>
          </div>
          <button
            onClick={() => handleSync("matches", true)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <DownloadCloud className="w-5 h-5" />}
            Sync Matches & xG
          </button>
        </div>

        {/* Manual Init WC 2026 */}
        <div className="bg-gradient-to-b from-slate-900 to-indigo-950/40 border border-indigo-500/20 p-6 rounded-2xl flex flex-col justify-between shadow-lg shadow-indigo-950/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-emerald-200">Khởi tạo WC 2026</h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">API Free Bypass</span>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Tạo thủ công 48 đội tuyển (12 bảng) và sinh lịch thi đấu 72 trận vòng bảng trực tiếp vào Database.
            </p>
          </div>
          <button
            onClick={() => handleSync("manual-2026", false)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-indigo-900/50 disabled:opacity-50 animate-pulse"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
            Khởi tạo WC 2026
          </button>
        </div>
      </div>

      {/* Result Area */}
      {error && (
        <div className="bg-rose-950/50 border border-rose-900/50 p-6 rounded-2xl flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-rose-400 font-bold mb-1">Đồng bộ thất bại</h4>
            <p className="text-rose-300/80 text-sm">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-emerald-950/30 border border-emerald-900/50 p-6 rounded-2xl flex items-start gap-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-emerald-400 font-bold mb-2">{result.message}</h4>
            <pre className="text-xs text-emerald-300/70 bg-black/30 p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(result.results, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
