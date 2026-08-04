import React from "react";
import { GraduationCap } from "lucide-react";

/**
 * VocabHeader - Server Component tĩnh (100% Static Shell)
 * Được Pre-render sẵn tại Build Time để đảm bảo 0ms FCP.
 */
export default function VocabHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs shrink-0">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
            Kho Từ Vựng SRS
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Spaced Repetition System • Long-term Memory
          </p>
        </div>
      </div>
    </div>
  );
}
