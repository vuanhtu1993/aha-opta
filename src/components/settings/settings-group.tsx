import React from "react";

interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
        {title}
      </h3>
      <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-2xs">
        {children}
      </div>
    </div>
  );
}
