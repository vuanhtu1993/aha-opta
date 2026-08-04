import React from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { connectDB } from "@/lib/db/mongoose";
import VocabCard from "@/lib/db/models/VocabCard";
import VocabCardItem, { VocabCardData } from "./VocabCardItem";

interface VocabCardListProps {
  search?: string;
  level?: string;
  sort?: string;
}

/**
 * VocabCardList - Async Server Component
 * Truy vấn danh sách thẻ trực tiếp từ MongoDB theo bộ lọc URL và render các Client Island (VocabCardItem).
 */
export default async function VocabCardList({
  search = "",
  level = "all",
  sort = "due_asc",
}: VocabCardListProps) {
  await connectDB();

  const filter: Record<string, any> = {};

  if (search.trim()) {
    filter.$or = [
      { word: { $regex: search.trim(), $options: "i" } },
      { explanation: { $regex: search.trim(), $options: "i" } },
    ];
  }

  if (level && level !== "all") {
    filter.level = level;
  }

  let sortObj: Record<string, any> = { "fsrs.due": 1 };
  if (sort === "newest") {
    sortObj = { createdAt: -1 };
  } else if (sort === "alpha") {
    sortObj = { word: 1 };
  } else if (sort === "stability_desc") {
    sortObj = { "fsrs.stability": -1 };
  }

  const rawCards = await VocabCard.find(filter).sort(sortObj).lean();
  const totalCount = await VocabCard.countDocuments({});

  // Chuyển đổi ObjectId thành string để an toàn khi truyền xuống Client Components
  const cards: VocabCardData[] = rawCards.map((c: any) => ({
    _id: c._id.toString(),
    word: c.word,
    ipa: c.ipa,
    explanation: c.explanation,
    level: c.level,
    wordFamily: c.wordFamily,
    collocations: c.collocations,
    sourceStorybookTitle: c.sourceStorybookTitle,
    fsrs: {
      due: c.fsrs?.due ? new Date(c.fsrs.due).toISOString() : undefined,
      stability: c.fsrs?.stability,
      reps: c.fsrs?.reps,
      state: c.fsrs?.state,
    },
  }));

  if (cards.length === 0) {
    return (
      <div className="text-center py-14 space-y-3 bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto text-xl">
          📚
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {search || level !== "all"
              ? "Không tìm thấy từ vựng phù hợp"
              : "Kho từ vựng của bạn đang trống"}
          </h3>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            {search || level !== "all"
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
    );
  }

  return (
    <div className="space-y-3">
      {cards.map((card) => (
        <VocabCardItem key={card._id} card={card} />
      ))}
    </div>
  );
}
