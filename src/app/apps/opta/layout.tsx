/**
 * Opta App Layout (Phase 5)
 * 
 * Áp dụng Dark Mode mặc định cho aha-opta.
 * Màu chủ đạo: Slate-900 (Nền), Emerald-500 (Điểm nhấn/Tích cực).
 */

import { ReactNode } from "react";
import Link from "next/link";
import { Activity, Trophy, BarChart3, Database } from "lucide-react";

export default function OptaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500/30">
      {/* Navbar nội bộ của aha-opta */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/apps/opta" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight">aha<span className="text-emerald-400">-opta</span></span>
              </Link>
              
              <div className="hidden md:flex items-center gap-1">
                <NavLink href="/apps/opta" icon={<Trophy className="w-4 h-4"/>}>Dự đoán (WC 2026)</NavLink>
                <NavLink href="/apps/opta/teams" icon={<BarChart3 className="w-4 h-4"/>}>Đội bóng & Xếp hạng</NavLink>
                <NavLink href="/apps/opta/sync" icon={<Database className="w-4 h-4"/>}>Data Pipeline</NavLink>
              </div>
            </div>
            
            <div className="text-xs font-mono text-slate-500 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              LangGraph Agent v1.0
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-12 text-center text-slate-500 text-sm">
        <p>Made by Anh Tu - Share to be share</p>
      </footer>
    </div>
  );
}

function NavLink({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
