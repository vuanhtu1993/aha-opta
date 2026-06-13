"use client";

import { useState, useEffect } from "react";
import { ProbabilityBars } from "./ProbabilityBars";
import { BrainCircuit, Loader2, Database, Search, CheckCircle2, AlertCircle, RefreshCcw } from "lucide-react";
import type { AutoFetchResult } from "@/app/api/opta/matches/autofetch/route";

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

  // States cho Auto-Fetch
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [fetchPreview, setFetchPreview] = useState<AutoFetchResult | null>(null);

  const [formData, setFormData] = useState({
    homeScore: match.homeScore !== null && match.homeScore !== undefined ? String(match.homeScore) : "",
    awayScore: match.awayScore !== null && match.awayScore !== undefined ? String(match.awayScore) : "",
    possession: match.homeStats?.possession !== null && match.homeStats?.possession !== undefined ? String(match.homeStats.possession) : "50",
    homeShots: match.homeStats?.shots !== null && match.homeStats?.shots !== undefined ? String(match.homeStats.shots) : "",
    awayShots: match.awayStats?.shots !== null && match.awayStats?.shots !== undefined ? String(match.awayStats.shots) : "",
    homeSOT: match.homeStats?.shotsOnTarget !== null && match.homeStats?.shotsOnTarget !== undefined ? String(match.homeStats.shotsOnTarget) : "",
    awaySOT: match.awayStats?.shotsOnTarget !== null && match.awayStats?.shotsOnTarget !== undefined ? String(match.awayStats.shotsOnTarget) : "",
    homeXG: match.homeStats?.xGoals !== null && match.homeStats?.xGoals !== undefined ? String(match.homeStats.xGoals) : "",
    awayXG: match.awayStats?.xGoals !== null && match.awayStats?.xGoals !== undefined ? String(match.awayStats.xGoals) : "",
    homePassAcc: match.homeStats?.passAccuracy !== null && match.homeStats?.passAccuracy !== undefined ? String(match.homeStats.passAccuracy) : "",
    awayPassAcc: match.awayStats?.passAccuracy !== null && match.awayStats?.passAccuracy !== undefined ? String(match.awayStats.passAccuracy) : "",
  });

  // Đồng bộ formData với prop match mới nhất mỗi khi match thay đổi (ví dụ: sau khi save thành công)
  useEffect(() => {
    setFormData({
      homeScore: match.homeScore !== null && match.homeScore !== undefined ? String(match.homeScore) : "",
      awayScore: match.awayScore !== null && match.awayScore !== undefined ? String(match.awayScore) : "",
      possession: match.homeStats?.possession !== null && match.homeStats?.possession !== undefined ? String(match.homeStats.possession) : "50",
      homeShots: match.homeStats?.shots !== null && match.homeStats?.shots !== undefined ? String(match.homeStats.shots) : "",
      awayShots: match.awayStats?.shots !== null && match.awayStats?.shots !== undefined ? String(match.awayStats.shots) : "",
      homeSOT: match.homeStats?.shotsOnTarget !== null && match.homeStats?.shotsOnTarget !== undefined ? String(match.homeStats.shotsOnTarget) : "",
      awaySOT: match.awayStats?.shotsOnTarget !== null && match.awayStats?.shotsOnTarget !== undefined ? String(match.awayStats.shotsOnTarget) : "",
      homeXG: match.homeStats?.xGoals !== null && match.homeStats?.xGoals !== undefined ? String(match.homeStats.xGoals) : "",
      awayXG: match.awayStats?.xGoals !== null && match.awayStats?.xGoals !== undefined ? String(match.awayStats.xGoals) : "",
      homePassAcc: match.homeStats?.passAccuracy !== null && match.homeStats?.passAccuracy !== undefined ? String(match.homeStats.passAccuracy) : "",
      awayPassAcc: match.awayStats?.passAccuracy !== null && match.awayStats?.passAccuracy !== undefined ? String(match.awayStats.passAccuracy) : "",
    });
  }, [match]);

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  // Auto-fetch kết quả từ internet bằng Gemini Search
  const handleAutoFetch = async () => {
    setIsFetching(true);
    setFetchError("");
    setFetchPreview(null);
    try {
      const res = await fetch("/api/opta/matches/autofetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match._id }),
      });
      const result = await res.json();
      if (result.success) {
        setFetchPreview(result.data);
        // Tự động điền dữ liệu vào form luôn để user không phải click "Dùng kết quả này"
        if (result.data && result.data.played) {
          setFormData(prev => ({
            ...prev,
            homeScore: String(result.data.homeScore ?? prev.homeScore),
            awayScore: String(result.data.awayScore ?? prev.awayScore),
            possession: result.data.homePossession !== undefined ? String(result.data.homePossession) : prev.possession,
            homeShots: result.data.homeShots !== undefined ? String(result.data.homeShots) : prev.homeShots,
            awayShots: result.data.awayShots !== undefined ? String(result.data.awayShots) : prev.awayShots,
            homeSOT: result.data.homeSOT !== undefined ? String(result.data.homeSOT) : prev.homeSOT,
            awaySOT: result.data.awaySOT !== undefined ? String(result.data.awaySOT) : prev.awaySOT,
            homeXG: result.data.homeXG !== undefined ? String(result.data.homeXG) : prev.homeXG,
            awayXG: result.data.awayXG !== undefined ? String(result.data.awayXG) : prev.awayXG,
            homePassAcc: result.data.homePassAccuracy !== undefined ? String(result.data.homePassAccuracy) : prev.homePassAcc,
            awayPassAcc: result.data.awayPassAccuracy !== undefined ? String(result.data.awayPassAccuracy) : prev.awayPassAcc,
          }));
        }
      } else {
        setFetchError(result.error || "Không tìm thấy kết quả");
      }
    } catch (err) {
      setFetchError("Lỗi kết nối mạng");
    } finally {
      setIsFetching(false);
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
          homeScore: formData.homeScore,
          awayScore: formData.awayScore,
          homePossession: formData.possession,
          homeShots: formData.homeShots,
          awayShots: formData.awayShots,
          homeSOT: formData.homeSOT,
          awaySOT: formData.awaySOT,
          homeXG: formData.homeXG,
          awayXG: formData.awayXG,
          homePassAccuracy: formData.homePassAcc,
          awayPassAccuracy: formData.awayPassAcc,
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
      <div className="bg-white border border-[#121C42]/10 rounded-2xl overflow-hidden shadow-xl shadow-[#121C42]/5">
        {/* Header */}
        <div className="px-5 py-3 border-b border-[#121C42]/10 bg-[#f8fafc] flex justify-between items-center gap-3">
          <span className="font-semibold text-[#121C42] text-xs">{home.name} vs {away.name}</span>
          <div className="flex items-center gap-2">
            {/* Nút Tự động tìm kết quả */}
            <button
              type="button"
              onClick={handleAutoFetch}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 hover:bg-[#10b981]/20 disabled:opacity-50 transition-all"
            >
              {isFetching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
              {isFetching ? "Đang tìm..." : "Tự động tìm"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-[#121C42]/50 hover:text-[#121C42] font-bold text-xs"
            >
              Hủy
            </button>
          </div>
        </div>

        {/* Preview kết quả fetch — hiện trước khi điền vào form */}
        {fetchPreview && (
          <div className={`mx-5 mt-4 rounded-2xl border p-4 ${!fetchPreview.played
              ? "bg-amber-50 border-amber-200"
              : fetchPreview.confidence === "high"
                ? "bg-[#10b981]/5 border-[#10b981]/30"
                : "bg-blue-50 border-blue-200"
            }`}>
            {!fetchPreview.played ? (
              // Trận chưa diễn ra
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">Trận đấu chưa diễn ra</p>
                  <p className="text-xs text-amber-700 mt-0.5">{fetchPreview.message}</p>
                </div>
              </div>
            ) : (
              // Tìm thấy kết quả
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
                  <span className="text-xs font-bold text-[#121C42]">
                    Tìm thấy kết quả
                    {fetchPreview.source && (
                      <span className="ml-1.5 font-normal text-[#121C42]/50">từ {fetchPreview.source}</span>
                    )}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto ${fetchPreview.confidence === "high" ? "bg-[#10b981]/10 text-[#10b981]" :
                      fetchPreview.confidence === "medium" ? "bg-amber-100 text-amber-700" :
                        "bg-rose-100 text-rose-600"
                    }`}>
                    {fetchPreview.confidence === "high" ? "Tin cậy cao" :
                      fetchPreview.confidence === "medium" ? "Trung bình" : "Cần kiểm tra"}
                  </span>
                </div>

                {/* Tỉ số lớn */}
                <div className="flex items-center justify-center gap-4 py-2">
                  <span className="font-black text-[#121C42] text-lg">{home.name}</span>
                  <span className="font-black text-3xl text-[#121C42] font-mono bg-white border border-[#121C42]/10 px-5 py-1 rounded-xl shadow-sm">
                    {fetchPreview.homeScore} – {fetchPreview.awayScore}
                  </span>
                  <span className="font-black text-[#121C42] text-lg">{away.name}</span>
                </div>

                {/* Thống kê chi tiết nếu có */}
                {(fetchPreview.homePossession !== undefined || fetchPreview.homeShots !== undefined || fetchPreview.homeXG !== undefined || fetchPreview.homePassAccuracy !== undefined) && (
                  <div className="grid grid-cols-2 gap-2 text-center mt-3">
                    {fetchPreview.homePossession !== undefined && (
                      <div className="bg-white rounded-lg p-2 border border-[#121C42]/10 shadow-sm">
                        <div className="text-[10px] text-[#121C42]/50 font-mono font-semibold uppercase tracking-wider">Kiểm soát bóng</div>
                        <div className="text-xs font-bold text-[#121C42] mt-1">{fetchPreview.homePossession}% — {100 - fetchPreview.homePossession}%</div>
                      </div>
                    )}
                    {(fetchPreview.homeShots !== undefined || fetchPreview.homeSOT !== undefined) && (
                      <div className="bg-white rounded-lg p-2 border border-[#121C42]/10 shadow-sm">
                        <div className="text-[10px] text-[#121C42]/50 font-mono font-semibold uppercase tracking-wider">Sút (Trúng đích)</div>
                        <div className="text-xs font-bold text-[#121C42] mt-1">
                          {fetchPreview.homeShots ?? 0} ({fetchPreview.homeSOT ?? 0}) — {fetchPreview.awayShots ?? 0} ({fetchPreview.awaySOT ?? 0})
                        </div>
                      </div>
                    )}
                    {fetchPreview.homeXG !== undefined && (
                      <div className="bg-white rounded-lg p-2 border border-[#121C42]/10 shadow-sm">
                        <div className="text-[10px] text-[#121C42]/50 font-mono font-semibold uppercase tracking-wider">xG</div>
                        <div className="text-xs font-bold text-[#121C42] mt-1">{fetchPreview.homeXG?.toFixed(2)} — {fetchPreview.awayXG?.toFixed(2)}</div>
                      </div>
                    )}
                    {fetchPreview.homePassAccuracy !== undefined && (
                      <div className="bg-white rounded-lg p-2 border border-[#121C42]/10 shadow-sm">
                        <div className="text-[10px] text-[#121C42]/50 font-mono font-semibold uppercase tracking-wider">Chuyền chính xác</div>
                        <div className="text-xs font-bold text-[#121C42] mt-1">{fetchPreview.homePassAccuracy}% — {fetchPreview.awayPassAccuracy}%</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Nút hành động */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setFetchPreview(null)}
                    className="flex-1 text-xs font-medium py-2 rounded-xl border border-[#121C42]/10 text-[#121C42]/60 hover:bg-[#f8fafc] transition-colors"
                  >
                    Bỏ qua
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFetchPreview(null);
                      // Tự động lưu luôn vì đã được fill vào form
                      handleUpdateSubmit(new Event('submit') as any);
                    }}
                    className="flex-1 text-xs font-bold py-2 rounded-xl bg-[#3B5BDB] text-white hover:bg-[#264de4] transition-colors shadow-lg shadow-[#3B5BDB]/20"
                  >
                    Lưu kết quả ngay →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lỗi fetch */}
        {fetchError && (
          <div className="mx-5 mt-4 flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {fetchError}
          </div>
        )}

        <form onSubmit={handleUpdateSubmit} className="p-5 space-y-4 text-sm">
          {/* Tỉ số */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#121C42]/60 mb-1">{home.name} (Bàn thắng)</label>
              <input
                type="number"
                min="0"
                value={formData.homeScore}
                onChange={e => handleFormChange("homeScore", e.target.value)}
                className="w-full bg-white border border-[#121C42]/20 rounded-lg px-3 py-2 text-[#121C42] font-bold text-center focus:border-[#3B5BDB] focus:ring-2 focus:ring-[#3B5BDB]/20 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#121C42]/60 mb-1">{away.name} (Bàn thắng)</label>
              <input
                type="number"
                min="0"
                value={formData.awayScore}
                onChange={e => handleFormChange("awayScore", e.target.value)}
                className="w-full bg-white border border-[#121C42]/20 rounded-lg px-3 py-2 text-[#121C42] font-bold text-center focus:border-[#3B5BDB] focus:ring-2 focus:ring-[#3B5BDB]/20 outline-none"
                required
              />
            </div>
          </div>

          {/* Kiểm soát bóng */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-[#121C42]/60 mb-1">
              <span>Kiểm soát: {home.name} ({formData.possession}%)</span>
              <span>{away.name} ({100 - parseInt(formData.possession || "50", 10)}%)</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={formData.possession}
              onChange={e => handleFormChange("possession", e.target.value)}
              className="w-full accent-[#3B5BDB] bg-slate-200 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Cú sút */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#121C42]/60 mb-1">{home.name} (Tổng sút / Trúng đích)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Sút"
                  value={formData.homeShots}
                  onChange={e => handleFormChange("homeShots", e.target.value)}
                  className="w-full bg-white border border-[#121C42]/20 rounded-lg px-2 py-1.5 text-center text-xs text-[#121C42] focus:border-[#3B5BDB] focus:ring-1 focus:ring-[#3B5BDB]/20 outline-none"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Trúng"
                  value={formData.homeSOT}
                  onChange={e => handleFormChange("homeSOT", e.target.value)}
                  className="w-full bg-white border border-[#121C42]/20 rounded-lg px-2 py-1.5 text-center text-xs text-[#121C42] focus:border-[#3B5BDB] focus:ring-1 focus:ring-[#3B5BDB]/20 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#121C42]/60 mb-1">{away.name} (Tổng sút / Trúng đích)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Sút"
                  value={formData.awayShots}
                  onChange={e => handleFormChange("awayShots", e.target.value)}
                  className="w-full bg-white border border-[#121C42]/20 rounded-lg px-2 py-1.5 text-center text-xs text-[#121C42] focus:border-[#3B5BDB] focus:ring-1 focus:ring-[#3B5BDB]/20 outline-none"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Trúng"
                  value={formData.awaySOT}
                  onChange={e => handleFormChange("awaySOT", e.target.value)}
                  className="w-full bg-white border border-[#121C42]/20 rounded-lg px-2 py-1.5 text-center text-xs text-[#121C42] focus:border-[#3B5BDB] focus:ring-1 focus:ring-[#3B5BDB]/20 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bàn thắng kỳ vọng xG */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#121C42]/60 mb-1">{home.name} xG thực</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.homeXG}
                onChange={e => handleFormChange("homeXG", e.target.value)}
                className="w-full bg-white border border-[#121C42]/20 rounded-lg px-3 py-2 text-[#121C42] font-mono text-center focus:border-[#3B5BDB] focus:ring-2 focus:ring-[#3B5BDB]/20 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#121C42]/60 mb-1">{away.name} xG thực</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.awayXG}
                onChange={e => handleFormChange("awayXG", e.target.value)}
                className="w-full bg-white border border-[#121C42]/20 rounded-lg px-3 py-2 text-[#121C42] font-mono text-center focus:border-[#3B5BDB] focus:ring-2 focus:ring-[#3B5BDB]/20 outline-none"
              />
            </div>
          </div>

          {/* Độ chính xác chuyền bóng (Pass Accuracy) */}
          <div>
            <div className="text-xs font-semibold text-[#121C42]/60 mb-2">% Chuyền bóng chính xác</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-[#121C42]/50 mb-1">{home.name} (%)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={formData.homePassAcc}
                  onChange={e => handleFormChange("homePassAcc", e.target.value)}
                  className="w-full bg-white border border-[#121C42]/20 rounded-lg px-3 py-2 text-[#121C42] font-mono text-center focus:border-[#3B5BDB] focus:ring-2 focus:ring-[#3B5BDB]/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#121C42]/50 mb-1">{away.name} (%)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={formData.awayPassAcc}
                  onChange={e => handleFormChange("awayPassAcc", e.target.value)}
                  className="w-full bg-white border border-[#121C42]/20 rounded-lg px-3 py-2 text-[#121C42] font-mono text-center focus:border-[#3B5BDB] focus:ring-2 focus:ring-[#3B5BDB]/20 outline-none"
                />
              </div>
            </div>
          </div>

          {formError && <p className="text-rose-500 text-xs">{formError}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="w-1/2 bg-[#f8fafc] border border-[#121C42]/10 hover:bg-slate-100 text-[#121C42]/70 font-medium py-2 rounded-xl text-center"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="w-1/2 bg-[#3B5BDB] hover:bg-[#264de4] disabled:opacity-50 text-white font-medium py-2 rounded-xl flex items-center justify-center gap-1.5"
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
    <div className="bg-white border border-[#121C42]/10 rounded-2xl overflow-hidden hover:border-[#3B5BDB]/50 transition-all duration-300 shadow-xl">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[#121C42]/10 bg-[#f8fafc] flex justify-between items-center text-xs font-medium text-[#121C42]/60">
        <span>{date.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })} - {match.stage}</span>
        <div className="flex items-center gap-2">
          {match.group && <span className="px-2 py-0.5 rounded-md bg-[#f8fafc] border border-[#121C42]/10 text-[#121C42]">Bảng {match.group}</span>}
          <button
            onClick={() => setIsEditing(true)}
            className="px-2 py-0.5 rounded bg-white hover:bg-[#3B5BDB]/10 text-[#3B5BDB] border border-[#121C42]/10 text-[10px]"
          >
            Cập nhật kết quả
          </button>
        </div>
      </div>

      {/* Teams */}
      <div className="p-5">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col items-center gap-2 w-1/3">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden border border-[#121C42]/10 shadow-sm">
              {home.flag ? <img src={home.flag} alt={home.name} className="w-full h-full object-cover" /> : <span className="text-xs">{home.shortName}</span>}
            </div>
            <span className="font-bold text-center">{home.name}</span>
          </div>

          <div className="flex flex-col items-center justify-center w-1/3 text-[#121C42]/40">
            <span className="text-xs uppercase tracking-widest font-bold mb-1">VS</span>
            <span className="text-xl font-bold text-[#121C42]">
              {match.status === "finished" ? `${match.homeScore} - ${match.awayScore}` : "- : -"}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 w-1/3">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden border border-[#121C42]/10 shadow-sm">
              {away.flag ? <img src={away.flag} alt={away.name} className="w-full h-full object-cover" /> : <span className="text-xs">{away.shortName}</span>}
            </div>
            <span className="font-bold text-center">{away.name}</span>
          </div>
        </div>

        {/* Action / Prediction Result */}
        <div className="mt-4 pt-4 border-t border-[#121C42]/10 min-h-[120px] flex flex-col justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center text-[#3B5BDB] gap-3 py-4">
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

              <div className="bg-[#f8fafc] p-3 rounded-lg text-sm text-[#121C42]/70 border border-[#3B5BDB]/20">
                <div className="flex gap-2 items-start">
                  <BrainCircuit className="w-4 h-4 text-[#3B5BDB] mt-0.5 shrink-0" />
                  <p className="leading-relaxed text-xs">{prediction.reasoning}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              {error && <p className="text-rose-400 text-sm mb-3">{error}</p>}
              <button
                onClick={handlePredict}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B5BDB] text-white font-medium hover:bg-[#264de4] transition-all shadow-lg shadow-[#3B5BDB]/30 active:scale-95"
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
