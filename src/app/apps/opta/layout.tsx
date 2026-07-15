/**
 * Opta App Layout (FIFA 2026 Theme)
 * 
 * Áp dụng Light Mode theo thiết kế của FIFA.
 * Màu chủ đạo: Light Blue (#7DB0FF), Vibrant Blue (#3B5BDB), Deep Navy (#121C42).
 */

import type { Metadata } from "next";
import { ReactNode } from "react";
import { OptaNavbar } from "./components/OptaNavbar";

export const metadata: Metadata = {
  title: "World Cup 2026 Predictions | Aha-Mind Opta",
  description: "Dự đoán World Cup 2026 dựa trên chỉ số Opta. Phân tích sức mạnh đội tuyển, bảng xếp hạng và khả năng vô địch.",
};

export default function OptaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#121C42] font-sans selection:bg-[#3B5BDB]/30 relative overflow-x-hidden">

      {/* Background Decorator Lines/Shapes (Global) */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-[#8DB7F4] -z-20" />
      <div 
        className="absolute top-[-20%] left-[-10%] w-[120%] h-[60vh] -z-20"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(141, 183, 244, 0.3) 0%, rgba(141, 183, 244, 0) 70%)'
        }}
      />

      {/* Navbar nội bộ của aha-opta */}
      <OptaNavbar />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>
    </div>
  );
}
