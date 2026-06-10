/**
 * Opta App Layout (FIFA 2026 Theme)
 * 
 * Áp dụng Light Mode theo thiết kế của FIFA.
 * Màu chủ đạo: Light Blue (#7DB0FF), Vibrant Blue (#3B5BDB), Deep Navy (#121C42).
 */

import { ReactNode } from "react";
import { OptaNavbar } from "./components/OptaNavbar";

export default function OptaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#121C42] font-sans selection:bg-[#3B5BDB]/30 relative overflow-x-hidden">
      
      {/* Background Decorator Lines/Shapes (Global) */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-[#8DB7F4] -z-20" />
      <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[60vh] bg-[#8DB7F4]/20 rounded-b-[50%] -z-20 blur-3xl" />

      {/* Navbar nội bộ của aha-opta */}
      <OptaNavbar />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-8 mt-12 text-center text-[#121C42]/60 text-sm border-t border-[#121C42]/10 relative z-10">
        <p>Made by Anh Tu - Share to be share</p>
      </footer>
    </div>
  );
}
