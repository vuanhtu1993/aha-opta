"use client";

import { useState } from "react";
import { Database, DownloadCloud, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function SyncPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

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
        body: JSON.stringify({ type, scrapeXg })
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-emerald-900/50 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <DownloadCloud className="w-5 h-5" />}
            Sync Matches & xG
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
