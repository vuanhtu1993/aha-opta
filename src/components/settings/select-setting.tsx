import React from "react";
import { ChevronRight } from "lucide-react";

interface SelectSettingProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
}

export function SelectSetting({ icon, label, value, onClick }: SelectSettingProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="text-slate-600 dark:text-slate-300 text-lg shrink-0">{icon}</div>
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</div>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
        <span>{value}</span>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>
    </div>
  );
}
