"use client";

interface ProgressCountdownProps {
  totalMs: number;
  remainingMs: number;
  isActive: boolean;
}

export function ProgressCountdown({ totalMs, remainingMs, isActive }: ProgressCountdownProps) {
  const percentage = totalMs > 0 ? ((totalMs - remainingMs) / totalMs) * 100 : 0;

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{isActive ? "🎤 Đang đọc theo..." : "⏸ Chờ..."}</span>
        <span>{(remainingMs / 1000).toFixed(1)}s</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-100 ease-linear"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
