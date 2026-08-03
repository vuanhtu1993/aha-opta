import React from "react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen w-full bg-slate-200/60 dark:bg-slate-950 flex justify-center selection:bg-amber-400 selection:text-slate-900">
      <div className="w-full max-w-[480px] min-h-screen bg-slate-50 dark:bg-slate-900 border-x border-slate-200/80 dark:border-slate-800 flex flex-col relative app-shell-shadow">
        <main className="flex-1 pb-20 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
