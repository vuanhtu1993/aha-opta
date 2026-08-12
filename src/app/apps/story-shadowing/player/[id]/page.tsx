"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShadowingPlayer } from "@/components/story-shadowing/shadowing-player";
import { VocabCard, type KeywordItem } from "@/components/story-shadowing/vocab-card";
import { Button } from "@/components/ui/button";
import type { Sentence } from "@/lib/schemas/story-shadowing.schema";
import { BookOpen, Sparkles } from "lucide-react";

type SeriesPart = {
  _id: string;
  title: string;
  partIndex: number;
  partTitle?: string;
  totalParts?: number;
};

export const revalidate = 3600 // invalidate every hour

export default function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [title, setTitle] = useState<string>("");
  const [level, setLevel] = useState<"easy" | "medium" | "hard" | null>(null);
  const [sourceType, setSourceType] = useState<"text" | "youtube">("text");
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Series state
  const [seriesId, setSeriesId] = useState<string | undefined>(undefined);
  const [partIndex, setPartIndex] = useState<number | undefined>(undefined);
  const [partTitle, setPartTitle] = useState<string | undefined>(undefined);
  const [totalParts, setTotalParts] = useState<number | undefined>(undefined);
  const [seriesParts, setSeriesParts] = useState<SeriesPart[]>([]);

  const [keywords, setKeywords] = useState<KeywordItem[]>([]);
  const [savedWordSet, setSavedWordSet] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<"vocab" | "shadowing">("shadowing");

  useEffect(() => {
    fetch(`/api/story-shadowing/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Không tìm thấy bài luyện tập");
        return res.json();
      })
      .then(async (data) => {
        setSentences(data.sentences || []);
        setTitle(data.title || "");
        setLevel(data.level);
        setSourceType(data.sourceType || "text");
        setYoutubeVideoId(data.youtubeVideoId);

        setSeriesId(data.seriesId);
        setPartIndex(data.partIndex);
        setPartTitle(data.partTitle);
        setTotalParts(data.totalParts);

        if (data.seriesId) {
          try {
            const seriesRes = await fetch(
              `/api/story-shadowing/series/${data.seriesId}`
            );
            if (seriesRes.ok) {
              const seriesData = await seriesRes.json();
              setSeriesParts(seriesData);
            }
          } catch (e) {
            console.error("[PlayerPage] Failed to load series parts:", e);
          }
        }

        if (data.keywords && data.keywords.length > 0) {
          setKeywords(data.keywords);
          setStep("vocab");

          // Kiểm tra xem các từ vựng này đã có trong SRS chưa
          const wordList = data.keywords
            .map((kw: KeywordItem) => kw.word)
            .filter(Boolean);
          if (wordList.length > 0) {
            try {
              const checkRes = await fetch("/api/vocab/check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ words: wordList }),
              });
              if (checkRes.ok) {
                const checkData = await checkRes.json();
                setSavedWordSet(new Set(checkData.savedWords || []));
              }
            } catch (err) {
              console.error("[PlayerPage] Failed to check saved keywords:", err);
            }
          }
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-20 text-xs text-slate-400">
        Đang tải bài đọc...
      </div>
    );
  }

  if (error || !sentences.length) {
    return (
      <div className="p-6 text-center py-20 space-y-4">
        <p className="text-xs font-semibold text-rose-500">
          {error || "Dữ liệu trống"}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/apps/story-shadowing")}
          className="text-xs font-bold text-amber-500 hover:underline"
        >
          Quay lại danh sách bài học
        </Button>
      </div>
    );
  }

  const prevPart = seriesParts.find((p) => p.partIndex === (partIndex ?? 0) - 1);
  const nextPart = seriesParts.find((p) => p.partIndex === (partIndex ?? 0) + 1);

  return (
    <div className="p-4 space-y-4 pb-28">
      {/* Series Navigation Header Bar */}
      {seriesId && (
        <div className="bg-slate-900 dark:bg-slate-800 text-white p-3 rounded-2xl flex items-center justify-between shadow-2xs border border-slate-800 dark:border-slate-700">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="text-[10px] px-2 py-0.5 bg-amber-400/20 text-amber-300 font-bold rounded-full shrink-0">
              Phần {(partIndex ?? 0) + 1}/{totalParts || seriesParts.length}
            </span>
            <span className="text-xs font-bold truncate text-slate-200">
              {partTitle || title}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {prevPart ? (
              <Link
                href={`/apps/story-shadowing/player/${prevPart._id}`}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-semibold transition-colors"
                title="Phần trước"
              >
                ◀ Trước
              </Link>
            ) : (
              <span className="px-2 py-1 opacity-20 text-[10px]">◀</span>
            )}
            {nextPart ? (
              <Link
                href={`/apps/story-shadowing/player/${nextPart._id}`}
                className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-lg text-[10px] font-bold transition-colors shadow-2xs"
              >
                Tiếp ▶
              </Link>
            ) : (
              <span className="px-2 py-1 opacity-20 text-[10px]">▶</span>
            )}
          </div>
        </div>
      )}

      {step === "vocab" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              <h1 className="text-lg font-black text-slate-900 dark:text-white">
                Vocabulary
              </h1>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {keywords.length} từ vựng then chốt
            </span>
          </div>

          <div className="space-y-3">
            {keywords.map((kw, i) => (
              <VocabCard
                key={i}
                keyword={kw}
                storybookId={id}
                storybookTitle={title}
                isInitiallySaved={savedWordSet.has(kw.word?.toLowerCase())}
                onSaved={(word) => {
                  setSavedWordSet(
                    (prev) => new Set([...prev, word.toLowerCase()])
                  );
                }}
              />
            ))}
          </div>

          <Button
            onClick={() => setStep("shadowing")}
            variant="amber"
            size="lg"
            shape="rounded2Xl"
            className="w-full py-3.5 text-xs shadow-sm font-extrabold"
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Bắt đầu luyện Shadowing!
          </Button>
        </div>
      ) : (
        <ShadowingPlayer
          sentences={sentences}
          title={title}
          level={level}
          sourceType={sourceType}
          youtubeVideoId={youtubeVideoId}
        />
      )}
    </div>
  );
}

