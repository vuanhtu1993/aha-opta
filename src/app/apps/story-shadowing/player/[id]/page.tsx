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
          <h3 className="text-xl font-bold text-slate-900">{kw.word}</h3>
          <p className="text-slate-600 mt-1">{kw.explanation}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
            kw.level === "hard" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
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
                {kw.wordFamily.map((wf: string, idx: number) => (
                  <li key={idx} className="text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    {wf}
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
                {kw.collocations.map((col: string, idx: number) => (
                  <li key={idx} className="text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    {col}
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
      <div className="max-w-2xl mx-auto space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Từ vựng cần nhớ</h1>
            <p className="text-slate-500 mt-1">Nắm vững các từ khoá này sẽ giúp bạn hiểu bài đọc dễ dàng hơn.</p>
          </div>
          <button
            onClick={() => router.push("/apps/story-shadowing")}
            className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
          >
            ← Thoát
          </button>
        </div>

        <div className="space-y-4">
          {keywords.map((kw, i) => (
            <VocabCard key={i} kw={kw} />
          ))}
        </div>

        <button
          onClick={() => setStep("shadowing")}
          className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-lg shadow-md"
        >
          Tôi đã hiểu, bắt đầu luyện tập!
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
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
