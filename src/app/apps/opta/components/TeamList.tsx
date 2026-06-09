"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Trophy, TrendingUp, Sparkles, Filter, ArrowUpDown } from "lucide-react";

interface TeamListProps {
  teams: any[];
}

export function TeamList({ teams }: TeamListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedConfed, setSelectedConfed] = useState("all");
  const [sortBy, setSortBy] = useState<"elo" | "fifa" | "name" | "group">("elo");

  // Danh sách các bảng đấu (A đến L)
  const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  // Danh sách các liên đoàn khu vực
  const CONFEDERATIONS = ["UEFA", "CONMEBOL", "AFC", "CAF", "CONCACAF", "OFC"];

  // Xử lý lọc và sắp xếp dữ liệu
  const filteredAndSortedTeams = useMemo(() => {
    let result = [...teams];

    // 1. Tìm kiếm theo tên hoặc tên viết tắt
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.shortName.toLowerCase().includes(term) ||
          t.country.toLowerCase().includes(term)
      );
    }

    // 2. Lọc theo bảng đấu
    if (selectedGroup !== "all") {
      result = result.filter((t) => t.group === selectedGroup);
    }

    // 3. Lọc theo liên đoàn
    if (selectedConfed !== "all") {
      result = result.filter((t) => t.confederation === selectedConfed);
    }

    // 4. Sắp xếp
    result.sort((a, b) => {
      if (sortBy === "elo") {
        return (b.eloRating || 1500) - (a.eloRating || 1500); // Elo cao xếp trước
      }
      if (sortBy === "fifa") {
        return (a.fifaRanking || 999) - (b.fifaRanking || 999); // FIFA hạng nhỏ (1, 2) xếp trước
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "group") {
        return a.group.localeCompare(b.group) || (b.eloRating || 1500) - (a.eloRating || 1500);
      }
      return 0;
    });

    return result;
  }, [teams, searchTerm, selectedGroup, selectedConfed, sortBy]);

  return (
    <div className="space-y-6">
      {/* Search and Filters panel */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm đội bóng (e.g. Brazil, ENG, Germany)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-slate-100 placeholder-slate-500 transition-all outline-none"
            />
          </div>

          {/* Confederation Dropdown & Sort Selector */}
          <div className="flex flex-wrap gap-4 items-center w-full lg:w-auto justify-end">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-500 shrink-0" />
              <select
                value={selectedConfed}
                onChange={(e) => setSelectedConfed(e.target.value)}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500 transition-all shrink-0 cursor-pointer"
              >
                <option value="all">Tất cả khu vực (Confed)</option>
                {CONFEDERATIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-emerald-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500 transition-all shrink-0 cursor-pointer"
              >
                <option value="elo">Sắp xếp: Elo Rating</option>
                <option value="fifa">Sắp xếp: FIFA Ranking</option>
                <option value="name">Sắp xếp: Tên đội (A-Z)</option>
                <option value="group">Sắp xếp: Bảng đấu</option>
              </select>
            </div>
          </div>
        </div>

        {/* Group chips filter */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Lọc theo Bảng đấu</div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedGroup("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                selectedGroup === "all"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-850"
              }`}
            >
              ALL
            </button>
            {GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                  selectedGroup === g
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-850"
                }`}
              >
                Bảng {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Results status */}
      <div className="flex items-center justify-between text-sm text-slate-500 px-1 font-mono">
        <span>Tìm thấy {filteredAndSortedTeams.length} đội bóng</span>
        {searchTerm || selectedGroup !== "all" || selectedConfed !== "all" ? (
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedGroup("all");
              setSelectedConfed("all");
            }}
            className="text-emerald-500 hover:underline text-xs"
          >
            Reset bộ lọc
          </button>
        ) : null}
      </div>

      {/* Teams grid */}
      {filteredAndSortedTeams.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredAndSortedTeams.map((team) => (
            <Link
              key={team._id}
              href={`/apps/opta/teams/${team.slug}`}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-850 hover:border-emerald-500/50 p-5 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-950/20"
            >
              {/* Glowing hover background */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="flex items-start justify-between">
                {/* Team flag & info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-9 rounded-lg overflow-hidden border border-white/10 shrink-0 relative bg-slate-950 shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={team.flag || "https://flagcdn.com/w320/un.png"}
                      alt={`${team.name} flag`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-100 group-hover:text-white transition-colors line-clamp-1">
                      {team.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                        {team.shortName}
                      </span>
                      <span className="text-slate-600 text-xs">•</span>
                      <span className="text-[10px] font-semibold text-slate-400 font-mono">
                        {team.confederation}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Group Badge */}
                <span className="text-[10px] font-extrabold font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  Bảng {team.group}
                </span>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-850 my-4" />

              {/* Ratings */}
              <div className="grid grid-cols-2 gap-4">
                {/* Elo Rating */}
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 font-mono">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    Elo Rating
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-extrabold text-white font-mono">
                      {team.eloRating || 1500}
                    </span>
                    {team.eloRank > 0 && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        #{team.eloRank}
                      </span>
                    )}
                  </div>
                </div>

                {/* FIFA Rank */}
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 font-mono">
                    <Trophy className="w-3 h-3 text-amber-500" />
                    FIFA Rank
                  </div>
                  <div>
                    <span className="text-lg font-extrabold text-slate-200 font-mono">
                      #{team.fifaRanking || "--"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Button Hint */}
              <div className="mt-4 flex items-center justify-end text-[10px] font-bold text-slate-600 group-hover:text-emerald-400 transition-colors gap-1 uppercase tracking-wider font-mono">
                Xem chi tiết
                <Sparkles className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <p className="text-slate-500 mb-2">Không tìm thấy đội bóng nào khớp với bộ lọc hiện tại.</p>
          <p className="text-sm text-slate-600">Hãy thử xóa từ khóa tìm kiếm hoặc đổi bảng đấu.</p>
        </div>
      )}
    </div>
  );
}
