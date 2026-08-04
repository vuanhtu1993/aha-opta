"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import VocabSearchFilter from "./VocabSearchFilter";
import VocabCardItem, { VocabCardData } from "./VocabCardItem";

interface VocabCardSectionProps {
  initialCards: VocabCardData[];
  totalCount: number;
}

/**
 * VocabCardSection - Client Island
 * Quản lý trạng thái tìm kiếm, lọc level, sắp xếp trong React State.
 * Tự động gọi API /api/vocab khi người dùng thay đổi bộ lọc (không sửa URL searchParams).
 */
export default function VocabCardSection({
  initialCards,
  totalCount,
}: VocabCardSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedSort, setSelectedSort] = useState("due_asc");
  const [cards, setCards] = useState<VocabCardData[]>(initialCards);
  const [isFetching, setIsFetching] = useState(false);

  const isFirstRender = useRef(true);

  useEffect(() => {
    // Bỏ qua lần render đầu tiên vì đã có initialCards do Server nạp sẵn
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      setIsFetching(true);
      try {
        const params = new URLSearchParams();
        if (searchTerm.trim()) params.set("search", searchTerm.trim());
        if (selectedLevel && selectedLevel !== "all") {
          params.set("level", selectedLevel);
        }
        if (selectedSort) params.set("sort", selectedSort);

        const res = await fetch(`/api/vocab?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setCards(data.cards || []);
          }
        }
      } catch (err) {
        console.error("Failed to fetch vocab cards", err);
      } finally {
        if (!isCancelled) {
          setIsFetching(false);
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm, selectedLevel, selectedSort]);

  const hasFilter = Boolean(searchTerm.trim() || selectedLevel !== "all");

  return (
    <div className="space-y-4">
      {/* Search & Level Filter (Controlled Component) */}
      <VocabSearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedLevel={selectedLevel}
        onLevelChange={setSelectedLevel}
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
        isFetching={isFetching}
      />

      {/* Cards List or Empty State */}
      {cards.length === 0 ? (
        <div className="text-center py-14 space-y-3 bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto text-xl">
            📚
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {hasFilter
                ? "Không tìm thấy từ vựng phù hợp"
                : "Kho từ vựng của bạn đang trống"}
            </h3>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              {hasFilter
                ? "Thử thay đổi từ khoá tìm kiếm hoặc bộ lọc level."
                : "Mở bài học Story Shadowing và bấm nút '+ Lưu vào SRS' trên các từ quan trọng để bắt đầu học."}
            </p>
          </div>
          {totalCount === 0 && !hasFilter && (
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
        <div
          className={`space-y-3 transition-opacity duration-200 ${
            isFetching ? "opacity-60" : "opacity-100"
          }`}
        >
          {cards.map((card) => (
            <VocabCardItem key={card._id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}
