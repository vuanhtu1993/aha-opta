import { connectDB } from "@/lib/db/mongoose";
import { Team } from "@/lib/db/models/Team";
import { Match } from "@/lib/db/models/Match";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Trophy,
  TrendingUp,
  Activity,
  Calendar,
  MapPin,
  Percent,
  Zap,
  Target,
  ShieldAlert,
  Sparkles,
  History,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Hàm sinh metadata động cho SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await connectDB();
  const { slug } = await params;
  const team = await Team.findOne({ slug }).lean() as any;

  if (!team) {
    return {
      title: "Không tìm thấy đội bóng | aha-opta",
    };
  }

  return {
    title: `Chi tiết Đội tuyển ${team.name} | aha-opta`,
    description: `Thống kê phong độ, điểm số Elo, xếp hạng FIFA, và lịch thi đấu của đội tuyển ${team.name} tại vòng chung kết FIFA World Cup 2026.`,
  };
}

export default async function TeamDetailPage({ params }: PageProps) {
  await connectDB();
  const { slug } = await params;

  // 1. Fetch thông tin đội tuyển
  const teamDoc = await Team.findOne({ slug }).lean() as any;
  if (!teamDoc) {
    notFound();
  }

  // 2. Fetch danh sách trận đấu của đội đó (sắp xếp theo thời gian tăng dần)
  const matchesDocs = await Match.find({
    $or: [{ homeTeamId: teamDoc._id }, { awayTeamId: teamDoc._id }]
  })
    .populate("homeTeamId awayTeamId")
    .sort({ matchDate: 1 })
    .lean() as any[];

  // 3. Serialize data sang plain object để tránh lỗi Next.js Server/Client component boundary
  const team = {
    ...teamDoc,
    _id: teamDoc._id.toString(),
    eloLastSynced: teamDoc.eloLastSynced ? teamDoc.eloLastSynced.toISOString() : null,
    lastUpdated: teamDoc.lastUpdated ? teamDoc.lastUpdated.toISOString() : null,
    recentEloMatches: teamDoc.recentEloMatches ? teamDoc.recentEloMatches.map((m: any) => ({
      date: m.date,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      tournament: m.tournament,
      ratingChange: m.ratingChange,
      ratingAfter: m.ratingAfter,
      rankAfter: m.rankAfter,
    })) : [],
  };

  const matches = matchesDocs.map((doc: any) => ({
    ...doc,
    _id: doc._id.toString(),
    homeTeamId: doc.homeTeamId ? {
      _id: doc.homeTeamId._id.toString(),
      name: doc.homeTeamId.name,
      shortName: doc.homeTeamId.shortName,
      flag: doc.homeTeamId.flag,
      slug: doc.homeTeamId.slug,
    } : null,
    awayTeamId: doc.awayTeamId ? {
      _id: doc.awayTeamId._id.toString(),
      name: doc.awayTeamId.name,
      shortName: doc.awayTeamId.shortName,
      flag: doc.awayTeamId.flag,
      slug: doc.awayTeamId.slug,
    } : null,
    matchDate: doc.matchDate.toISOString(),
  }));

  // Định nghĩa màu sắc tương ứng theo confederation
  const confedColorMap: Record<string, string> = {
    UEFA: "bg-blue-500/10 text-[#8DB7F4] border-blue-500/20",
    CONMEBOL: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    AFC: "bg-[#3B5BDB]/10 text-[#3B5BDB] border-[#3B5BDB]/20",
    CAF: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    CONCACAF: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    OFC: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  };

  const confedBadgeColor = confedColorMap[team.confederation] || "bg-[#f8fafc] text-[#121C42]/60 border-[#121C42]/10";

  // Thống kê phong độ
  const stats = team.stats || {
    matchesPlayed: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    xGoalsFor: 0,
    xGoalsAgainst: 0,
    possessionAvg: 0,
    shotsOnTargetAvg: 0,
    passAccuracyAvg: 0,
    formIndex: 0
  };

  // Xác định màu sắc chỉ số phong độ (Form Index)
  const getFormColor = (val: number) => {
    if (val >= 70) return "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/20";
    if (val >= 40) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  return (
    <div className="space-y-8">
      {/* Back to List */}
      <div>
        <Link
          href="/apps/opta/teams"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#121C42]/60 hover:text-[#3B5BDB] transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Quay lại danh sách đội bóng
        </Link>
      </div>

      {/* Hero Header Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white to-[#8DB7F4]/10 border border-[#121C42]/10 p-6 sm:p-10 shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-80 h-80 bg-[#3B5BDB]/5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 bg-[#8DB7F4]/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Flag and basic info */}
          <div className="flex items-center gap-6">
            <div className="w-24 h-16 rounded-2xl overflow-hidden border border-[#121C42]/10 shrink-0 relative bg-white shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={team.flag || "https://flagcdn.com/w320/un.png"}
                alt={`${team.name} flag`}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#121C42] tracking-tight">{team.name}</h1>
                <span className="text-xs uppercase font-mono font-bold px-2 py-0.5 bg-[#f8fafc] rounded border border-[#121C42]/10 text-[#121C42]/60">
                  {team.shortName}
                </span>
              </div>
              <p className="text-[#121C42]/60 text-sm mt-1 font-medium flex items-center gap-2">
                <span>Group {team.group}</span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${confedBadgeColor}`}>
                  {team.confederation}
                </span>
              </p>
            </div>
          </div>

          {/* Ranks and ratings details */}
          <div className="flex flex-wrap gap-4 sm:gap-6">
            {/* Elo rating card */}
            <div className="bg-white border border-[#121C42]/10 shadow-sm px-5 py-3 rounded-2xl min-w-[120px]">
              <div className="text-[10px] font-bold text-[#121C42]/60 uppercase tracking-wider flex items-center gap-1 font-mono">
                <TrendingUp className="w-3 h-3 text-[#3B5BDB]" />
                Elo Rating
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-[#121C42] font-mono">{team.eloRating || 1500}</span>
                {team.eloRank > 0 && (
                  <span className="text-xs text-[#121C42]/40 font-mono">#{team.eloRank}</span>
                )}
              </div>
            </div>

            {/* FIFA rank card */}
            <div className="bg-white border border-[#121C42]/10 shadow-sm px-5 py-3 rounded-2xl min-w-[120px]">
              <div className="text-[10px] font-bold text-[#121C42]/60 uppercase tracking-wider flex items-center gap-1 font-mono">
                <Trophy className="w-3 h-3 text-[#3B5BDB]" />
                FIFA Ranking
              </div>
              <div className="mt-1">
                <span className="text-2xl font-black text-[#121C42] font-mono">#{team.fifaRanking || "--"}</span>
              </div>
            </div>

            {/* Form index card */}
            <div className="bg-white border border-[#121C42]/10 shadow-sm px-5 py-3 rounded-2xl min-w-[120px]">
              <div className="text-[10px] font-bold text-[#121C42]/60 uppercase tracking-wider flex items-center gap-1 font-mono">
                <Activity className="w-3 h-3 text-[#3B5BDB]" />
                Chỉ số Form
              </div>
              <div className="mt-1">
                <span className={`inline-block text-lg font-black px-2.5 py-0.5 rounded-lg border font-mono ${getFormColor(stats.formIndex)}`}>
                  {stats.formIndex || 0}/100
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Stats and analytics */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-bold text-[#121C42] flex items-center gap-2">
            Phong độ
          </h2>

          <div className="bg-white border border-[#121C42]/10 p-6 rounded-2xl space-y-6 shadow-sm">
            {/* Wins, Draws, Losses representation */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-[#121C42]/60 font-mono">
                <span>Số trận đã đấu: {stats.matchesPlayed}</span>
                <span>Thắng - Hòa - Thua</span>
              </div>
              <div className="flex h-3.5 rounded-full overflow-hidden bg-[#f8fafc] border border-[#121C42]/10 p-0.5">
                {stats.matchesPlayed > 0 ? (
                  <>
                    <div
                      className="bg-[#10b981] transition-all rounded-l-full"
                      style={{ width: `${(stats.wins / stats.matchesPlayed) * 100}%` }}
                      title={`Thắng: ${stats.wins}`}
                    />
                    <div
                      className="bg-[#121C42]/20 transition-all"
                      style={{ width: `${(stats.draws / stats.matchesPlayed) * 100}%` }}
                      title={`Hòa: ${stats.draws}`}
                    />
                    <div
                      className="bg-rose-500 transition-all rounded-r-full"
                      style={{ width: `${(stats.losses / stats.matchesPlayed) * 100}%` }}
                      title={`Thua: ${stats.losses}`}
                    />
                  </>
                ) : (
                  <div className="w-full bg-[#121C42]/5 rounded-full" />
                )}
              </div>
              <div className="flex justify-between text-[11px] font-mono text-[#121C42]/60 mt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981]" /> Thắng: {stats.wins}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#121C42]/20" /> Hòa: {stats.draws}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Thua: {stats.losses}</span>
              </div>
            </div>

            {/* Goals metrics */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#121C42]/10">
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold text-[#121C42]/60 uppercase tracking-wider font-mono">Bàn thắng (GF)</div>
                <div className="text-xl font-extrabold text-[#121C42] font-mono">{stats.goalsFor}</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold text-[#121C42]/60 uppercase tracking-wider font-mono">Bàn thua (GA)</div>
                <div className="text-xl font-extrabold text-[#121C42]/60 font-mono">{stats.goalsAgainst}</div>
              </div>
            </div>

            {/* xG Comparison */}
            <div className="space-y-4 pt-4 border-t border-[#121C42]/10">
              <div className="flex justify-between items-center text-xs font-semibold text-[#121C42]/60 font-mono">
                <span>Chỉ số xG thực tế</span>
                <span className="text-[10px] uppercase bg-[#10b981]/10 text-[#10b981] px-2 py-0.5 rounded border border-[#10b981]/20">Model xG</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#121C42]/60">xGoals công (xG)</span>
                  <span className="text-[#121C42] font-mono font-bold">{(stats.xGoalsFor || 0).toFixed(2)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#f8fafc] overflow-hidden">
                  <div
                    className="bg-[#10b981] h-full rounded-full transition-all"
                    style={{ width: `${Math.min(((stats.xGoalsFor || 0) / 3) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#121C42]/60">xGoals thủ (xGA)</span>
                  <span className="text-[#121C42]/80 font-mono font-bold">{(stats.xGoalsAgainst || 0).toFixed(2)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#f8fafc] overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(((stats.xGoalsAgainst || 0) / 3) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Performance Indicators */}
            <div className="space-y-3 pt-4 border-t border-[#121C42]/10">
              <div className="text-[10px] font-bold text-[#121C42]/60 uppercase tracking-wider font-mono">Chỉ số lối chơi trung bình</div>

              {/* Possession */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#121C42]/60 flex items-center gap-1.5"><Percent className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Kiểm soát bóng</span>
                <span className="text-[#121C42] font-mono font-bold">{stats.possessionAvg}%</span>
              </div>

              {/* Shots on Target */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#121C42]/60 flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-[#3B5BDB] shrink-0" /> Sút trúng đích</span>
                <span className="text-[#121C42] font-mono font-bold">{stats.shotsOnTargetAvg} sút/trận</span>
              </div>

              {/* Pass Accuracy */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#121C42]/60 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-[#3B5BDB] shrink-0" /> Chuyền bóng</span>
                <span className="text-[#121C42] font-mono font-bold">{stats.passAccuracyAvg}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Matches timelines */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-[#121C42] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#3B5BDB]" />
            Lịch thi đấu & Kết quả WC 2026
          </h2>

          {matches.length > 0 ? (
            <div className="space-y-4">
              {matches.map((match: any) => {
                const isHome = match.homeTeamId?._id === team._id;
                const opponent = isHome ? match.awayTeamId : match.homeTeamId;
                const matchDate = new Date(match.matchDate);
                const isFinished = match.status === "finished";

                return (
                  <div
                    key={match._id}
                    className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[#121C42]/10 hover:border-[#3B5BDB]/50 transition-colors shadow-sm"
                  >
                    {/* Time & Venue */}
                    <div className="space-y-1">
                      <div suppressHydrationWarning className="text-xs font-semibold text-[#121C42]/60 font-mono uppercase tracking-wider">
                        {matchDate.toLocaleDateString("vi-VN", {
                          weekday: "short",
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric"
                        })} - {matchDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[#121C42]/40">
                        <MapPin className="w-3 h-3 text-[#121C42]/30" />
                        <span className="line-clamp-1">{match.venue}</span>
                      </div>
                    </div>

                    {/* Matchup visual */}
                    <div className="flex items-center justify-center gap-4 py-2 w-full sm:w-auto">
                      {/* Self Team info */}
                      <div className="flex items-center gap-2.5 w-[110px] justify-end">
                        <span className="font-extrabold text-sm text-[#121C42] line-clamp-1 text-right">
                          {isHome ? team.name : opponent?.name}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-[#f8fafc] flex items-center justify-center overflow-hidden border border-[#121C42]/10 shrink-0 shadow-md">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={isHome ? team.flag : opponent?.flag || "https://flagcdn.com/w320/un.png"}
                            alt={isHome ? team.name : opponent?.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Score or VS badge */}
                      <div className="px-3 py-1.5 rounded-xl bg-[#f8fafc] border border-[#121C42]/10 font-mono text-center min-w-[70px]">
                        {isFinished ? (
                          <span className="text-sm font-black text-[#3B5BDB]">
                            {match.homeScore} - {match.awayScore}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-[#121C42]/40 uppercase tracking-widest">
                            VS
                          </span>
                        )}
                      </div>

                      {/* Opponent info */}
                      <div className="flex items-center gap-2.5 w-[110px]">
                        <div className="w-8 h-8 rounded-full bg-[#f8fafc] flex items-center justify-center overflow-hidden border border-[#121C42]/10 shrink-0 shadow-md">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={isHome ? opponent?.flag : team.flag || "https://flagcdn.com/w320/un.png"}
                            alt={isHome ? opponent?.name : team.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-extrabold text-sm text-[#121C42] line-clamp-1">
                          {isHome ? opponent?.name : team.name}
                        </span>
                      </div>
                    </div>

                    {/* Status badge & action link */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t border-[#121C42]/10 sm:border-0 pt-3 sm:pt-0 shrink-0">
                      {isFinished ? (
                        <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 uppercase tracking-wide">
                          Kết thúc
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded bg-[#f8fafc] text-[#121C42]/60 border border-[#121C42]/10 uppercase tracking-wide">
                            Chưa đá
                          </span>
                          <Link
                            href="/apps/opta"
                            className="text-[10px] font-bold text-[#3B5BDB] hover:text-indigo-300 uppercase tracking-wider flex items-center gap-0.5 border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 px-2 py-1 rounded transition-all font-mono"
                          >
                            Dự đoán
                            <Sparkles className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-[#121C42]/20 rounded-2xl bg-white shadow-sm">
              <p className="text-[#121C42]/40 mb-1">Không tìm thấy trận đấu nào cho đội tuyển này.</p>
              <p className="text-xs text-[#121C42]/30">Vui lòng kiểm tra lại luồng đồng bộ matches.</p>
            </div>
          )}
        </div>

      </div>

      {/* Lịch sử trận đấu quốc tế (Elo) */}
      <div className="space-y-6 pt-4">
        <h2 className="text-xl font-bold text-[#121C42] flex items-center gap-2">
          <History className="w-5 h-5 text-[#3B5BDB]" />
          History matches (Elo)
        </h2>

        {team.recentEloMatches && team.recentEloMatches.length > 0 ? (
          <div className="space-y-3">
            {team.recentEloMatches.map((m: any, idx: number) => {
              // Kiểm tra chính xác vai trò chủ nhà dựa trên tên hoặc slug
              const isHome =
                m.homeTeam.toLowerCase() === team.name.toLowerCase() ||
                m.homeTeam.toLowerCase() === team.country.toLowerCase() ||
                (m.homeTeam.toLowerCase() === "united states" || m.homeTeam.toLowerCase() === "usa") && team.slug === "united-states" ||
                (m.homeTeam.toLowerCase() === "cote d'ivoire" || m.homeTeam.toLowerCase() === "ivory coast") && team.slug === "cote-divoire" ||
                (m.homeTeam.toLowerCase() === "ir iran" || m.homeTeam.toLowerCase() === "iran") && team.slug === "iran" ||
                (m.homeTeam.toLowerCase() === "dr congo" || m.homeTeam.toLowerCase() === "democratic republic of congo") && team.slug === "dr-congo";

              const outcome = m.homeScore === m.awayScore
                ? "draw"
                : (isHome ? m.homeScore > m.awayScore : m.awayScore > m.homeScore)
                  ? "win"
                  : "loss";

              // Màu sắc & ký hiệu biến động Elo
              const isPositive = m.ratingChange > 0;
              const isNegative = m.ratingChange < 0;

              const changeBadge = isPositive
                ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
                : isNegative
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  : "bg-[#f8fafc] text-[#121C42]/60 border-[#121C42]/10";

              const changeSign = isPositive ? `+${m.ratingChange}` : String(m.ratingChange);

              // Màu sắc badge W/D/L viết tắt
              const outcomeBadge = outcome === "win"
                ? "bg-[#10b981] text-white font-black"
                : outcome === "loss"
                  ? "bg-rose-500 text-[#121C42] font-black"
                  : "bg-[#121C42]/20 text-[#121C42] font-bold";

              const outcomeChar = outcome === "win" ? "W" : outcome === "loss" ? "L" : "D";

              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 p-4 rounded-2xl bg-white border border-[#121C42]/10 hover:border-[#3B5BDB]/50 hover:bg-[#f8fafc] transition-all shadow-sm group relative overflow-hidden"
                >
                  {/* Glow chỉ thị kết quả ở rìa trái */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${outcome === "win" ? "bg-[#10b981]" : outcome === "loss" ? "bg-rose-500" : "bg-[#121C42]/20"
                    }`} />

                  {/* Cột 1: Thông tin Ngày & Giải đấu (3/12 cols) */}
                  <div className="md:col-span-3 space-y-1 pl-2">
                    <div className="text-xs font-semibold text-[#121C42]/60 font-mono flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#121C42]/40" />
                      {m.date}
                    </div>
                    <div className="text-[11px] text-[#121C42]/40 font-medium truncate max-w-[200px]" title={m.tournament}>
                      {m.tournament}
                    </div>
                  </div>

                  {/* Cột 2: Trận đấu & Tỷ số (5/12 cols) */}
                  <div className="md:col-span-5 flex items-center justify-between sm:justify-start gap-4">
                    {/* Kết quả W/D/L Badge */}
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shadow-sm select-none shrink-0 ${outcomeBadge}`}>
                      {outcomeChar}
                    </span>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <span className={`text-sm tracking-tight truncate max-w-[110px] ${isHome ? "text-[#121C42] font-extrabold" : "text-[#121C42]/60 font-medium"
                        }`}>
                        {m.homeTeam}
                      </span>

                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#f8fafc]/80 border border-[#121C42]/10 text-[#121C42]/80 tracking-wider">
                        {m.homeScore} - {m.awayScore}
                      </span>

                      <span className={`text-sm tracking-tight truncate max-w-[110px] ${!isHome ? "text-[#121C42] font-extrabold" : "text-[#121C42]/60 font-medium"
                        }`}>
                        {m.awayTeam}
                      </span>
                    </div>
                  </div>

                  {/* Cột 3: Chỉ số Elo & Biến động (4/12 cols) */}
                  <div className="md:col-span-4 flex items-center justify-between md:justify-end gap-6 border-t border-[#121C42]/10 md:border-0 pt-3 md:pt-0">
                    {/* Biến động Elo */}
                    <div className="flex flex-col items-start md:items-end">
                      <span className="text-[9px] text-[#121C42]/40 uppercase tracking-widest font-bold font-mono">Biến động</span>
                      <span className={`inline-flex items-center gap-0.5 text-xs px-2.5 py-0.5 rounded-full border mt-0.5 font-mono font-bold ${changeBadge}`}>
                        {changeSign}
                        {isPositive && <ArrowUpRight className="w-3 h-3" />}
                        {isNegative && <ArrowDownRight className="w-3 h-3" />}
                      </span>
                    </div>

                    {/* Elo hiện tại */}
                    <div className="flex flex-col items-start md:items-end font-mono">
                      <span className="text-[9px] text-[#121C42]/40 uppercase tracking-widest font-bold">Elo sau trận</span>
                      <span className="text-[#121C42] font-bold text-sm mt-0.5">{m.ratingAfter}</span>
                    </div>

                    {/* Hạng Elo */}
                    {m.rankAfter > 0 ? (
                      <div className="flex flex-col items-start md:items-end font-mono">
                        <span className="text-[9px] text-[#121C42]/40 uppercase tracking-widest font-bold">Hạng Elo</span>
                        <span className="text-[#121C42]/80 font-semibold text-sm mt-0.5">#{m.rankAfter}</span>
                      </div>
                    ) : (
                      <div className="hidden md:block w-12" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-[#121C42]/20 rounded-2xl bg-white shadow-sm">
            <p className="text-[#121C42]/40 mb-1">Chưa có lịch sử đấu Elo được đồng bộ.</p>
            <p className="text-xs text-[#121C42]/30 font-mono">Vui lòng bấm nút đồng bộ Elo ở trang Data Pipeline.</p>
          </div>
        )}
      </div>
    </div>
  );
}
