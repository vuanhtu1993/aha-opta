"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Activity, Trophy, BarChart3, Database, Menu, X } from "lucide-react";

export function OptaNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/apps/opta", icon: <Trophy className="w-4 h-4" />, label: "Dự đoán (WC 2026)" },
    { href: "/apps/opta/teams", icon: <BarChart3 className="w-4 h-4" />, label: "Đội bóng & Xếp hạng" },
    { href: "/apps/opta/sync", icon: <Database className="w-4 h-4" />, label: "Data Pipeline" }
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/apps/opta" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B5BDB] to-[#121C42] flex items-center justify-center shadow-lg shadow-[#3B5BDB]/20 group-hover:shadow-[#3B5BDB]/40 transition-shadow">
                <Image src="/logo.jpg" alt="Logo" width={50} height={50} />
              </div>
              <span className="font-bold text-xl tracking-tight text-[#121C42]">
                <span className="text-[#3B5BDB]">WC26</span>
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(link => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${isActive ? 'text-[#3B5BDB] bg-white shadow-sm border border-[#3B5BDB]/20' : 'text-[#121C42]/70 hover:text-[#121C42] hover:bg-white/50 border border-transparent'}`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-xs font-mono text-[#3B5BDB] bg-white/90 px-3 py-1.5 rounded-full border border-[#3B5BDB]/20 shadow-sm">
              FIFA World Cup 2026
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-[#121C42]/70 hover:text-[#121C42] bg-white/50 rounded-lg border border-white/40 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/40 bg-white/95 backdrop-blur-2xl">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map(link => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${isActive ? 'text-[#3B5BDB] bg-[#3B5BDB]/10 border border-[#3B5BDB]/20' : 'text-[#121C42]/70 hover:text-[#121C42] hover:bg-black/5 border border-transparent'}`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
