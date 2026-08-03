import React from "react";

interface ToggleSettingProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleSetting({ icon, label, description, checked, onChange }: ToggleSettingProps) {
  return (
    <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
      <div className="flex items-center gap-3 pr-4">
        <div className="text-slate-600 dark:text-slate-300 text-lg shrink-0">{icon}</div>
        <div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</div>
          {description && <div className="text-xs text-slate-400 dark:text-slate-400">{description}</div>}
        </div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded accent-amber-500 cursor-pointer shrink-0"
      />
    </label>
  );
}
