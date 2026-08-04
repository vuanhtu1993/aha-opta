"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  X,
  Volume2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Trophy,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import type { QuizQuestion } from "@/lib/srs/review-session.service";

interface ReviewResult {
  cardId: string;
  word: string;
  isCorrect: boolean;
  rating: number; // 1: Again, 2: Hard, 3: Good, 4: Easy
  responseTimeMs: number;
  nextDue: string;
  stability: number;
}

interface QuizPlayerProps {
  initialQuestions: QuizQuestion[];
}

export function QuizPlayer({ initialQuestions }: QuizPlayerProps) {
  const router = useRouter();

  // State seeded directly from Server Component props (0ms Loading Spinner!)
  const [questions] = useState<QuizQuestion[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [currentResult, setCurrentResult] = useState<ReviewResult | null>(null);
  const [sessionResults, setSessionResults] = useState<ReviewResult[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  // Response latency timer (measured in milliseconds for FSRS engine)
  const questionStartTimeRef = useRef<number>(Date.now());

  // Reset timer and answer state whenever moving to next question
  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      questionStartTimeRef.current = Date.now();
      setSelectedOptionId(null);
      setIsAnswered(false);
      setCurrentResult(null);
    }
  }, [currentIndex, questions]);

  const currentQ = questions[currentIndex];

  const playAudio = (word: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSelectOption = async (optionId: string, isCorrect: boolean) => {
    if (isAnswered || !currentQ) return;

    const responseTimeMs = Date.now() - questionStartTimeRef.current;
    setSelectedOptionId(optionId);
    setIsAnswered(true);

    try {
      const res = await fetch("/api/vocab/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: currentQ.cardId,
          isCorrect,
          responseTimeMs,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const result: ReviewResult = {
          cardId: currentQ.cardId,
          word: currentQ.word,
          isCorrect,
          rating: data.rating,
          responseTimeMs,
          nextDue: data.nextDue,
          stability: data.stability,
        };
        setCurrentResult(result);
        setSessionResults((prev) => [...prev, result]);
      }
    } catch (err) {
      console.error("Failed to submit review", err);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const formatIntervalDays = (nextDueStr?: string) => {
    if (!nextDueStr) return "";
    const due = new Date(nextDueStr);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    if (diffMs <= 0) return "Hôm nay";
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    if (diffMinutes < 60) return `${diffMinutes} phút`;
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    if (diffHours < 24) return `${diffHours} giờ`;
    const days = Math.round(diffHours / 24);
    return `${days} ngày`;
  };

  const getRatingBadge = (rating: number) => {
    switch (rating) {
      case 4:
        return { label: "Easy (Dễ)", color: "bg-emerald-50 text-emerald-600 border-emerald-200" };
      case 3:
        return { label: "Good (Tốt)", color: "bg-blue-50 text-blue-600 border-blue-200" };
      case 2:
        return { label: "Hard (Khó)", color: "bg-amber-50 text-amber-600 border-amber-200" };
      case 1:
      default:
        return { label: "Again (Ôn lại)", color: "bg-rose-50 text-rose-600 border-rose-200" };
    }
  };

  // Finished Screen / Empty Session
  if (isFinished || questions.length === 0) {
    const totalAnswered = sessionResults.length;
    const correctCount = sessionResults.filter((r) => r.isCorrect).length;
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 100;

    return (
      <div className="p-4 min-h-screen flex flex-col justify-between max-w-[480px] mx-auto pb-10">
        <div className="space-y-6 pt-8">
          {/* Trophy Icon */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <Trophy className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {totalAnswered > 0 ? "Hoàn thành phiên ôn tập!" : "Chưa có từ nào cần ôn"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              {totalAnswered > 0
                ? "Bộ não của bạn vừa kích hoạt lại các liên kết thần kinh cho các từ vựng này."
                : "Tất cả từ vựng đang ở chu kỳ ghi nhớ tốt hoặc bạn chưa lưu từ vựng nào."}
            </p>
          </div>

          {/* Results Summary Box */}
          {totalAnswered > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-750 rounded-2xl">
                  <div className="text-[10px] font-bold text-slate-400">Đã ôn</div>
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {totalAnswered}
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl">
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Chính xác
                  </div>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {accuracy}%
                  </div>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl">
                  <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    Đúng
                  </div>
                  <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                    {correctCount}/{totalAnswered}
                  </div>
                </div>
              </div>

              {/* Reviewed Words Mini List */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="text-[11px] font-bold text-slate-400">Kết quả từng từ:</div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                  {sessionResults.map((res, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-750 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {res.isCorrect ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {res.word}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Ôn lại sau: {formatIntervalDays(res.nextDue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-6">
          <Link
            href="/vocab"
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold rounded-2xl transition-all text-xs shadow-sm flex items-center justify-center gap-2 active:scale-98"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Về Kho Từ Vựng</span>
          </Link>
          <Link
            href="/apps/story-shadowing"
            className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all text-xs flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Tiếp tục luyện Story Shadowing</span>
          </Link>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 max-w-[480px] mx-auto pb-10">
      {/* Top Header Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/vocab")}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
            title="Thoát phiên ôn tập"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FSRS Quiz</span>
          </div>

          <div className="text-xs font-bold text-slate-400">
            {currentIndex + 1} / {questions.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question Card Area */}
      <div className="space-y-5 my-auto py-4">
        {/* Word Prompt Box */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {currentQ.word}
            </span>
            <button
              onClick={() => playAudio(currentQ.word)}
              className="p-1.5 text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/40 rounded-full transition-transform active:scale-90"
              title="Phát âm"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {currentQ.ipa && (
            <div className="font-mono text-xs text-slate-400 font-normal">
              {currentQ.ipa}
            </div>
          )}

          {currentQ.level && (
            <div className="pt-1">
              <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold border border-amber-200 dark:border-amber-900">
                {currentQ.level}
              </span>
            </div>
          )}
        </div>

        {/* 4 English Answer Choices */}
        <div className="space-y-2.5">
          {currentQ.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            let btnStyle =
              "bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-400 dark:hover:border-amber-500";

            if (isAnswered) {
              if (opt.isCorrect) {
                btnStyle =
                  "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs";
              } else if (isSelected && !opt.isCorrect) {
                btnStyle =
                  "bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-800 dark:text-rose-300";
              } else {
                btnStyle =
                  "bg-slate-50/50 dark:bg-slate-850 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-60";
              }
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt.id, opt.isCorrect)}
                disabled={isAnswered}
                className={`w-full p-4 rounded-2xl border text-left text-xs transition-all duration-200 flex items-start gap-3 shadow-2xs ${btnStyle}`}
              >
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-black flex items-center justify-center shrink-0">
                  {opt.id}
                </span>
                <span className="flex-1 leading-relaxed">{opt.text}</span>
                {isAnswered && opt.isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                )}
                {isAnswered && isSelected && !opt.isCorrect && (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback & Word Family Drawer after answering */}
        {isAnswered && currentResult && (
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${getRatingBadge(currentResult.rating).color
                    }`}
                >
                  {getRatingBadge(currentResult.rating).label}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  ⚡ {Math.round(currentResult.responseTimeMs / 100) / 10}s
                </span>
              </div>

              <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                Ôn lại: +{formatIntervalDays(currentResult.nextDue)}
              </div>
            </div>

            {/* Word Family / Collocations hint */}
            {currentQ.wordFamily && currentQ.wordFamily.length > 0 && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  👨‍👩‍👧‍👦 Family:{" "}
                </span>
                {currentQ.wordFamily.map((wf: any) => wf.word).join(", ")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Continue Button */}
      {isAnswered && (
        <div className="pt-4">
          <button
            onClick={handleNextQuestion}
            className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold rounded-2xl transition-all text-xs shadow-md flex items-center justify-center gap-2 active:scale-98"
          >
            <span>
              {currentIndex + 1 < questions.length
                ? "Tiếp theo"
                : "Xem kết quả tổng kết"}
            </span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
}
