/**
 * aha-opta — Trang chào mừng (Phase 1 placeholder)
 *
 * Sẽ được thay thế bằng Dashboard đầy đủ trong Phase 5.
 * Hiện tại: Hiển thị trạng thái setup + link smoke test API.
 */

import Link from "next/link";

export default function OptaPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="text-6xl">⚽</div>
        <h1 className="text-3xl font-bold text-slate-900">
          aha-<span className="text-green-600">opta</span>
        </h1>
        <p className="text-slate-500 text-lg">
          World Cup 2026 — AI Match Predictor
        </p>
      </div>

      {/* Build Status */}
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 space-y-4">
        <h2 className="font-semibold text-green-800 text-lg">
          🏗️ Trạng thái xây dựng
        </h2>
        <div className="space-y-2 text-sm">
          {[
            { label: "Phase 1: Kiến trúc & Database", done: true },
            { label: "Phase 2: Data Pipeline (ETL)", done: false },
            { label: "Phase 3: LangGraph AI Agent", done: false },
            { label: "Phase 4: Backend API", done: false },
            { label: "Phase 5: Frontend Dashboard", done: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span>{item.done ? "✅" : "⏳"}</span>
              <span className={item.done ? "text-green-700" : "text-slate-500"}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Smoke Test Links */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 space-y-3">
        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">
          API Smoke Tests
        </h2>
        <div className="space-y-2">
          <Link
            href="/api/opta/teams"
            target="_blank"
            className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
          >
            <code className="bg-white border rounded px-2 py-0.5">GET</code>
            /api/opta/teams
            <span className="text-slate-400">(→ empty array khi chưa sync)</span>
          </Link>
        </div>
      </div>

      {/* Architecture note */}
      <p className="text-center text-xs text-slate-400">
        Powered by Gemini Flash · LangGraph.js · MongoDB Atlas · StatsBomb Data
      </p>
    </div>
  );
}
