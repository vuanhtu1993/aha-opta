/**
 * Probability Bars Component
 * 
 * Hiển thị thanh tiến trình 3 màu cho xác suất Home/Draw/Away.
 */

import { cn } from "@/lib/utils";

interface ProbabilityBarsProps {
  homeName: string;
  awayName: string;
  homeProb: number;
  drawProb: number;
  awayProb: number;
  className?: string;
}

export function ProbabilityBars({ homeName, awayName, homeProb, drawProb, awayProb, className }: ProbabilityBarsProps) {
  // Đảm bảo không bị lỗi giao diện nếu prob < 0
  const h = Math.max(0, homeProb);
  const d = Math.max(0, drawProb);
  const a = Math.max(0, awayProb);
  
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex justify-between text-xs font-medium text-slate-400">
        <span className="text-emerald-400 truncate max-w-[30%]">{homeName}</span>
        <span className="text-slate-500">Hòa</span>
        <span className="text-rose-400 truncate max-w-[30%] text-right">{awayName}</span>
      </div>
      
      {/* Bar container */}
      <div className="h-2.5 flex w-full rounded-full overflow-hidden bg-slate-800">
        <div 
          className="bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000 ease-out"
          style={{ width: `${h}%` }}
        />
        <div 
          className="bg-slate-500 transition-all duration-1000 ease-out"
          style={{ width: `${d}%` }}
        />
        <div 
          className="bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-1000 ease-out"
          style={{ width: `${a}%` }}
        />
      </div>
      
      {/* Numbers */}
      <div className="flex justify-between text-sm font-bold">
        <span className="text-emerald-400">{h.toFixed(1)}%</span>
        <span className="text-slate-400">{d.toFixed(1)}%</span>
        <span className="text-rose-400">{a.toFixed(1)}%</span>
      </div>
    </div>
  );
}
