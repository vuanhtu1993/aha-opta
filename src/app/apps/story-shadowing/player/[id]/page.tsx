"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShadowingPlayer } from "@/components/story-shadowing/shadowing-player";
import type { Sentence } from "@/lib/schemas/story-shadowing.schema";

type SeriesPart = {
  _id: string;
  title: string;
  partIndex: number;
  partTitle?: string;
  totalParts?: number;
};

function VocabCard({ kw }: { kw: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
      <div
        className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 items-baseline flex flex-wrap gap-2">
            <span>{kw.word}</span>
            {kw.ipa && <span className="font-mono text-sm text-slate-500 font-normal">{kw.ipa}</span>}
          </h3>
          <p className="text-slate-600 mt-1">{kw.explanation}</p>
        </div>
        <div className="flex items-center gap-3 hidden md:flex">
          <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${kw.level === "hard" ? "text-red-700" : "text-yellow-500"}`}>
            {kw.level.toUpperCase()}
          </span>
          <div className={`text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
            ▼
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <div className={`px-5 transition-all duration-300 ease-in-out ${isExpanded ? "max-h-96 py-4 border-t border-slate-100 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {kw.wordFamily && kw.wordFamily.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <span>👨‍👩‍👧‍👦</span> Word Family
              </h4>
              <ul className="space-y-1">
                {kw.wordFamily.map((wf: { word: string; partOfSpeech?: string; ipa?: string; explanation: string }, idx: number) => (
                  <li key={idx} className="text-sm bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 flex flex-col gap-0.5">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800">{wf.word}</span>
                      {wf.partOfSpeech && <span className="text-xs font-medium text-slate-400">({wf.partOfSpeech})</span>}
                      {wf.ipa && <span className="font-mono text-xs text-slate-500">{wf.ipa}</span>}
                    </div>
                    <span className="text-slate-500 text-[13px]">{wf.explanation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {kw.collocations && kw.collocations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <span>🔗</span> Collocations
              </h4>
              <ul className="space-y-1">
                {kw.collocations.map((col: { collocation: string; explanation: string }, idx: number) => (
                  <li key={idx} className="text-sm bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 flex flex-col gap-0.5">
                    <span className="font-semibold text-slate-800">{col.collocation}</span>
                    <span className="text-slate-500 text-[13px]">{col.explanation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [title, setTitle] = useState<string>("");
  const [level, setLevel] = useState<"easy" | "medium" | "hard" | null>(null);
  const [sourceType, setSourceType] = useState<"text" | "youtube">("text");
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Series state
  const [seriesId, setSeriesId] = useState<string | undefined>(undefined);
  const [partIndex, setPartIndex] = useState<number | undefined>(undefined);
  const [partTitle, setPartTitle] = useState<string | undefined>(undefined);
  const [totalParts, setTotalParts] = useState<number | undefined>(undefined);
  const [seriesParts, setSeriesParts] = useState<SeriesPart[]>([]);

  const [keywords, setKeywords] = useState<any[]>([]);
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
            const seriesRes = await fetch(`/api/story-shadowing/series/${data.seriesId}`);
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
    return <div className="text-center py-20 text-slate-500">Đang tải bài đọc...</div>;
  }

  if (error || !sentences.length) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-red-500">{error || "Dữ liệu trống"}</p>
        <button
          onClick={() => router.push("/apps/story-shadowing")}
          className="text-indigo-600 underline"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  const prevPart = seriesParts.find((p) => p.partIndex === (partIndex ?? 0) - 1);
  const nextPart = seriesParts.find((p) => p.partIndex === (partIndex ?? 0) + 1);

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Series Navigation Header Bar */}
      {seriesId && (
        <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="text-xs px-2.5 py-1 bg-indigo-500/20 text-indigo-300 font-bold rounded-full flex-shrink-0">
              Phần {(partIndex ?? 0) + 1}/{totalParts || seriesParts.length}
            </span>
            <span className="text-sm font-semibold truncate text-slate-200">
              {partTitle || title}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {prevPart ? (
              <Link
                href={`/apps/story-shadowing/player/${prevPart._id}`}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                title="Phần trước"
              >
                ◀ Trước
              </Link>
            ) : (
              <span className="p-1.5 opacity-30 text-xs">◀</span>
            )}
            {nextPart ? (
              <Link
                href={`/apps/story-shadowing/player/${nextPart._id}`}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                Tiếp ▶
              </Link>
            ) : (
              <span className="p-1.5 opacity-30 text-xs">▶</span>
            )}
          </div>
        </div>
      )}

      {step === "vocab" ? (
        <div className="space-y-8">
          <div className="flex items-center">
            <button
              onClick={() => router.push("/apps/story-shadowing")}
              className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
              aria-label="Danh sách bài"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Vocabulary</h1>
            </div>
          </div>

          <div className="space-y-4">
            {keywords.map((kw, i) => (
              <VocabCard key={i} kw={kw} />
            ))}
          </div>

          <button
            onClick={() => setStep("shadowing")}
            className="w-full py-4 bg-shadowing-primary text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-lg shadow-md"
          >
            Let's practice!
          </button>
        </div>
      ) : (
        <ShadowingPlayer
          sentences={sentences}
          title={title}
          level={level}
          sourceType={sourceType}
          youtubeVideoId={youtubeVideoId}
          onBack={() => router.push("/apps/story-shadowing")}
        />
      )}
    </div>
  );
}
