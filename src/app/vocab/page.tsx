"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import {
  GraduationCap,
  Sparkles,
  Search,
  BookOpen,
  Volume2,
  ChevronDown,
  Trash2,
  ArrowRight,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpDown,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function VocabPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [sortBy, setSortBy] = useState("due_asc");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Fetch stats & due count
  const { data: statsData } = useSWR("/api/vocab/due-count", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000,
  });

  // Fetch vocabulary cards
  const queryUrl = `/api/vocab?search=${encodeURIComponent(
    searchTerm
  )}&level=${selectedLevel}&sort=${sortBy}`;
  const { data: listData, isLoading } = useSWR(queryUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 10000,
  });

  const cards = listData?.cards || [];
  const dueCount = statsData?.dueCount ?? 0;
  const totalCount = statsData?.totalCount ?? 0;
  const masteredCount = statsData?.masteredCount ?? 0;
  const learningCount = statsData?.learningCount ?? 0;

  const handleDeleteCard = async (cardId: string, word: string) => {
    if (!confirm(`Bạn có chắc muốn xoá từ "${word}" khỏi danh mục SRS không?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/vocab/${cardId}`, { method: "DELETE" });
      if (res.ok) {
        mutate(queryUrl);
        mutate("/api/vocab/due-count");
      }
    } catch (err) {
      console.error("Failed to delete card", err);
    }
  };

  const playAudio = (word: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const formatDueText = (dueDateStr: string, stability: number) => {
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffHours = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffHours <= 0) {
      return {
        text: "Cần ôn hôm nay ⏰",
        color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900",
      };
    } else if (diffHours < 24) {
      return {
        text: `Ôn sau ${diffHours}h`,
        color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900",
      };
    } else {
      const days = Math.round(diffHours / 24);
      if (stability >= 30) {
        return {
          text: `Đã nhớ lâu (${days}d)`,
          color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
        };
      }
      return {
        text: `Ôn sau ${days} ngày`,
        color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
      };
    }
  };

  return (
    <div className="p-4 space-y-5 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
              Kho Từ Vựng SRS
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Spaced Repetition System • Long-term Memory
            </p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-center shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400">Tổng từ</div>
          <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
            {totalCount}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-center shadow-2xs">
          <div className="text-[10px] font-bold text-rose-500">Cần ôn</div>
          <div className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">
            {dueCount}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-center shadow-2xs">
          <div className="text-[10px] font-bold text-blue-500">Đang học</div>
          <div className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">
            {learningCount}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-center shadow-2xs">
          <div className="text-[10px] font-bold text-emerald-500">Nhớ lâu</div>
          <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {masteredCount}
          </div>
        </div>
      </div>

      {/* Due Banner or Practice All CTA */}
      {dueCount > 0 ? (
        <div className="rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white shadow-md flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-black text-white">
              <Flame className="w-4 h-4 fill-white" />
              <span>{dueCount} từ vựng cần ôn tập ngay</span>
            </div>
            <p className="text-[11px] text-amber-100 line-clamp-1">
              Bài trắc nghiệm 4 lựa chọn 100% tiếng Anh chuẩn FSRS.
            </p>
          </div>
          <Link
            href="/vocab/review"
            className="shrink-0 px-3.5 py-2 bg-white hover:bg-amber-50 text-slate-900 font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1"
          >
            <span>Bắt đầu</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>
        </div>
      ) : totalCount > 0 ? (
        <div className="rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              Không có từ nào bị trễ hạn hôm nay.
            </span>
          </div>
          <Link
            href="/vocab/review?practice_all=true"
            className="shrink-0 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>Luyện tự do</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : null}

      {/* Search & Filter Controls */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm từ vựng hoặc định nghĩa..."
            className="w-full pl-9.5 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>

        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
          {/* Level Filter Chips */}
          <div className="flex items-center gap-1.5 shrink-0">
            {["all", "A1", "A2", "B1", "B2", "C1", "C2"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all ${selectedLevel === lvl
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
              >
                {lvl === "all" ? "Tất cả" : lvl}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="shrink-0 flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-slate-600 dark:text-slate-400 focus:outline-none cursor-pointer"
            >
              <option value="due_asc">Lịch ôn gần nhất</option>
              <option value="newest">Mới thêm</option>
              <option value="alpha">A - Z</option>
              <option value="stability_desc">Độ bền trí nhớ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vocabulary Cards List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-xs text-slate-400">
            Đang tải kho từ vựng...
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-14 space-y-3 bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto text-xl">
              📚
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {searchTerm || selectedLevel !== "all"
                  ? "Không tìm thấy từ vựng phù hợp"
                  : "Kho từ vựng của bạn đang trống"}
              </h3>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                {searchTerm || selectedLevel !== "all"
                  ? "Thử thay đổi từ khoá tìm kiếm hoặc bộ lọc level."
                  : "Mở bài học Story Shadowing và bấm nút '+ Lưu vào SRS' trên các từ quan trọng để bắt đầu học."}
              </p>
            </div>
            {totalCount === 0 && (
              <Link
                href="/apps/story-shadowing"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs rounded-xl shadow-2xs transition-all"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Khám phá bài học Story</span>
              </Link>
            )}
          </div>
        ) : (
          cards.map((card: any) => {
            const isExpanded = expandedCardId === card._id;
            const dueInfo = formatDueText(card.fsrs?.due, card.fsrs?.stability || 0);

            return (
              <div
                key={card._id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs overflow-hidden transition-all duration-200"
              >
                <div
                  className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-750/80"
                  onClick={() =>
                    setExpandedCardId(isExpanded ? null : card._id)
                  }
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {card.word}
                      </span>
                      {card.ipa && (
                        <span className="font-mono text-[11px] text-slate-400">
                          {card.ipa}
                        </span>
                      )}
                      <button
                        onClick={(e) => playAudio(card.word, e)}
                        className="p-1 text-slate-400 hover:text-amber-500 rounded-full hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors"
                        title="Phát âm"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {card.explanation}
                    </p>

                    {/* Metadata Pill Bar */}
                    <div className="flex items-center flex-wrap gap-2 pt-1">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${dueInfo.color}`}
                      >
                        {dueInfo.text}
                      </span>

                      {card.level && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-extrabold">
                          {card.level}
                        </span>
                      )}

                      {card.sourceStorybookTitle && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          Từ: {card.sourceStorybookTitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCard(card._id, card.word);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Xoá từ khỏi SRS"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""
                        }`}
                    />
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
                    {/* FSRS Details */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-750 border border-slate-200/80 dark:border-slate-700 text-[11px] space-y-1.5">
                      <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Trạng thái ghi nhớ FSRS</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-slate-500 dark:text-slate-400 text-[10px]">
                        <div>
                          Lượt ôn:{" "}
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {card.fsrs?.reps || 0}
                          </span>
                        </div>
                        <div>
                          Độ bền (S):{" "}
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {Math.round(card.fsrs?.stability || 0)}d
                          </span>
                        </div>
                        <div>
                          Lần quên:{" "}
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {card.fsrs?.lapses || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Word Family */}
                    {card.wordFamily && card.wordFamily.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                          <span>👨‍👩‍👧‍👦</span> Word Family
                        </h4>
                        <ul className="space-y-1">
                          {card.wordFamily.map((wf: any, idx: number) => (
                            <li
                              key={idx}
                              className="text-xs bg-white dark:bg-slate-750 px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col gap-0.5"
                            >
                              <div className="flex items-baseline gap-1.5">
                                <span className="font-bold text-slate-800 dark:text-slate-100">
                                  {wf.word}
                                </span>
                                {wf.partOfSpeech && (
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    ({wf.partOfSpeech})
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                                {wf.explanation}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Collocations */}
                    {card.collocations && card.collocations.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                          <span>🔗</span> Collocations
                        </h4>
                        <ul className="space-y-1">
                          {card.collocations.map((col: any, idx: number) => (
                            <li
                              key={idx}
                              className="text-xs bg-white dark:bg-slate-750 px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col gap-0.5"
                            >
                              <span className="font-bold text-slate-800 dark:text-slate-100">
                                {col.collocation}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                                {col.explanation}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer copyright */}
      <div className="pt-4 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
        Made by Anh Tu - Share to be share
      </div>
    </div>
  );
}
