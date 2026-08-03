"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mutate } from "swr";
import { ShadowingPlayer } from "@/components/story-shadowing/shadowing-player";
import type { Sentence } from "@/lib/schemas/story-shadowing.schema";
import { BookOpen, Sparkles, ChevronDown, BookmarkPlus, Check, Volume2 } from "lucide-react";

type SeriesPart = {
  _id: string;
  title: string;
  partIndex: number;
  partTitle?: string;
  totalParts?: number;
};

function VocabCard({
  kw,
  storybookId,
  storybookTitle,
  isInitiallySaved,
  onSaved,
}: {
  kw: any;
  storybookId: string;
  storybookTitle: string;
  isInitiallySaved: boolean;
  onSaved?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(isInitiallySaved);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsSaved(isInitiallySaved);
  }, [isInitiallySaved]);

  const handleSaveToSRS = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved || isSaving) return;

    try {
      setIsSaving(true);
      const res = await fetch("/api/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: kw.word,
          ipa: kw.ipa,
          explanation: kw.explanation,
          level: kw.level || "B1",
          wordFamily: kw.wordFamily,
          collocations: kw.collocations,
          sourceStorybookId: storybookId,
          sourceStorybookTitle: storybookTitle,
        }),
      });

      if (res.ok) {
        setIsSaved(true);
        onSaved?.();
        // Cập nhật lại badge và cache stats mà không cần reload
        mutate("/api/vocab/due-count");
      }
    } catch (err) {
      console.error("Failed to save vocab card to SRS", err);
    } finally {
      setIsSaving(false);
    }
  };

  const playPronunciation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(kw.word);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-2xs overflow-hidden transition-all duration-300">
      <div
        className="p-4 flex gap-3 items-start justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-base font-extrabold text-slate-900 dark:text-white">
              {kw.word}
            </span>
            {kw.ipa && (
              <span className="font-mono text-xs text-slate-400 font-normal">
                {kw.ipa}
              </span>
            )}
            <button
              onClick={playPronunciation}
              className="p-1 text-slate-400 hover:text-amber-500 rounded-full hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors"
              title="Phát âm từ này"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            {kw.explanation}
          </p>

          {/* Action button to save to SRS */}
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={handleSaveToSRS}
              disabled={isSaved || isSaving}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                isSaved
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                  : "bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-950/70 border border-amber-200 dark:border-amber-800"
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Đã lưu vào SRS</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Đang lưu..." : "+ Lưu vào SRS"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          {kw.level && (
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold whitespace-nowrap ${
                kw.level === "hard" || kw.level === "C1" || kw.level === "C2"
                  ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
                  : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900"
              }`}
            >
              {kw.level.toUpperCase()}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Expanded Content */}
      <div
        className={`px-4 transition-all duration-300 ease-in-out ${
          isExpanded
            ? "max-h-96 py-3 border-t border-slate-100 dark:border-slate-700/60 opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="space-y-3">
          {kw.wordFamily && kw.wordFamily.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <span>👨‍👩‍👧‍👦</span> Word Family
              </h4>
              <ul className="space-y-1">
                {kw.wordFamily.map(
                  (
                    wf: {
                      word: string;
                      partOfSpeech?: string;
                      ipa?: string;
                      explanation: string;
                    },
                    idx: number
                  ) => (
                    <li
                      key={idx}
                      className="text-xs bg-slate-50 dark:bg-slate-750 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-0.5"
                    >
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {wf.word}
                        </span>
                        {wf.partOfSpeech && (
                          <span className="text-[10px] font-medium text-slate-400">
                            ({wf.partOfSpeech})
                          </span>
                        )}
                        {wf.ipa && (
                          <span className="font-mono text-[10px] text-slate-400">
                            {wf.ipa}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {wf.explanation}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {kw.collocations && kw.collocations.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <span>🔗</span> Collocations
              </h4>
              <ul className="space-y-1">
                {kw.collocations.map(
                  (
                    col: { collocation: string; explanation: string },
                    idx: number
                  ) => (
                    <li
                      key={idx}
                      className="text-xs bg-slate-50 dark:bg-slate-750 px-2.5 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-0.5"
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {col.collocation}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {col.explanation}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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

  const [keywords, setKeywords] = useState<any[]>([]);
  const [savedWordSet, setSavedWordSet] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<"vocab" | "shadowing">("shadowing");

  useEffect(() => {
    fetch(`/api/story-shadowing/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Không tìm thấy bài luyện tập");
        return res.json();
      })
      .then(async (data) => {
        setSentences(data.sentences);
        setTitle(data.title);
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
            console.error("Failed to load series parts", e);
          }
        }

        if (data.keywords && data.keywords.length > 0) {
          setKeywords(data.keywords);
          setStep("vocab");

          // Kiểm tra xem các từ vựng này đã có trong SRS chưa
          const wordList = data.keywords.map((kw: any) => kw.word).filter(Boolean);
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
              console.error("Failed to check saved keywords", err);
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
        <button
          onClick={() => router.push("/apps/story-shadowing")}
          className="text-xs font-bold text-amber-500 hover:underline"
        >
          Quay lại danh sách bài học
        </button>
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
                kw={kw}
                storybookId={id}
                storybookTitle={title}
                isInitiallySaved={savedWordSet.has(kw.word?.toLowerCase())}
                onSaved={() => {
                  setSavedWordSet(
                    (prev) => new Set([...prev, kw.word?.toLowerCase()])
                  );
                }}
              />
            ))}
          </div>

          <button
            onClick={() => setStep("shadowing")}
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold rounded-2xl transition-all text-xs shadow-sm flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Bắt đầu luyện Shadowing!
          </button>
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
