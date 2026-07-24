"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ShadowingPlayer } from "@/components/story-shadowing/shadowing-player";
import type { Sentence } from "@/lib/schemas/story-shadowing.schema";

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
          <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${kw.level === "hard" ? "text-red-700" : "text-yellow-500"
            }`}>
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

  const [keywords, setKeywords] = useState<any[]>([]);
  const [step, setStep] = useState<"vocab" | "shadowing">("shadowing");

  useEffect(() => {
    fetch(`/api/story-shadowing/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Không tìm thấy bài luyện tập");
        return res.json();
      })
      .then((data) => {
        setSentences(data.sentences);
        setTitle(data.title);
        setLevel(data.level);
        setSourceType(data.sourceType || "text");
        setYoutubeVideoId(data.youtubeVideoId);

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

  if (step === "vocab") {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-8">
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
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <ShadowingPlayer
        sentences={sentences}
        title={title}
        level={level}
        sourceType={sourceType}
        youtubeVideoId={youtubeVideoId}
        onBack={() => router.push("/apps/story-shadowing")}
      />
    </div>
  );
}
