"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { useVisualViewport } from "@/lib/hooks/use-visual-viewport";
import {
  X,
  ArrowRight,
  Sparkles,
  Trophy,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { QuizQuestion } from "@/lib/srs/review-session.service";
import { MCQCard } from "./MCQCard";
import { ClozeCard } from "./ClozeCard";
import { QuizFeedback } from "./QuizFeedback";
import { formatIntervalDays } from "@/lib/utils/format-interval";
import { soundEffects } from "@/lib/services/sound-effects";
import { fireCompletionConfetti } from "@/lib/utils/confetti";
import { useVocabSpeaker } from "@/lib/hooks/use-vocab-speaker";

interface ReviewResult {
  cardId: string;
  word: string;
  isCorrect: boolean;
  rating: number;
  responseTimeMs: number;
  nextDue: string;
  stability: number;
}

interface QuizPlayerProps {
  initialQuestions: QuizQuestion[];
}

export function QuizPlayer({ initialQuestions }: QuizPlayerProps) {
  const router = useRouter();
  const { speak } = useVocabSpeaker();
  // Track visual viewport height để fix iOS Safari keyboard behavior:
  // Khi bàn phím ảo mở, iOS thu nhỏ visual viewport nhưng KHÔNG thu nhỏ layout viewport.
  // Nếu dùng 100vh/min-h-screen, iOS sẽ scroll page lên để reveal input => mất header.
  // Giải pháp: position:fixed + đặt top/height = visual viewport thực tế.
  const visualViewport = useVisualViewport();

  const [questions] = useState<QuizQuestion[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [currentResult, setCurrentResult] = useState<ReviewResult | null>(null);
  const [sessionResults, setSessionResults] = useState<ReviewResult[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [completedSentence, setCompletedSentence] = useState<string | undefined>(undefined);

  const questionStartTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      questionStartTimeRef.current = Date.now();
      setSelectedOptionId(null);
      setIsAnswered(false);
      setCurrentResult(null);
      setCompletedSentence(undefined);
    }
  }, [currentIndex, questions]);

  // Trigger completion UX effects (Chime Sound & Confetti Burst)
  useEffect(() => {
    if (isFinished && sessionResults.length > 0) {
      soundEffects.playSuccessChime();
      fireCompletionConfetti();
    }
  }, [isFinished, sessionResults.length]);

  const currentQ = questions[currentIndex];

  const submitReview = async (isCorrect: boolean) => {
    if (isAnswered || !currentQ) return;

    const responseTimeMs = Date.now() - questionStartTimeRef.current;
    setIsAnswered(true);

    // Phản hồi âm thanh tức thì cho từng câu hỏi + phát âm từ vựng khi đúng
    if (isCorrect) {
      soundEffects.playCorrectSound();
      speak(currentQ.word, currentQ.audioUrl);
    } else {
      soundEffects.playIncorrectSound();
    }

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
        mutate("/api/vocab/due-count");
      }
    } catch (err) {
      console.error("Failed to submit review", err);
    }
  };

  const handleSelectOption = (optionId: string, isCorrect: boolean) => {
    setSelectedOptionId(optionId);
    submitReview(isCorrect);
  };

  const handleSubmitCloze = (userInput: string, isCorrect: boolean) => {
    if (currentQ.exampleSentences && currentQ.exampleSentences.length > 0) {
      const full = currentQ.exampleSentences[0].sentence.replace(
        "___",
        currentQ.word
      );
      setCompletedSentence(full);
    }
    submitReview(isCorrect);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Direct user gesture activation for Web Audio & Confetti
      soundEffects.playSuccessChime();
      fireCompletionConfetti();
      setIsFinished(true);
      mutate("/api/vocab/due-count");
    }
  };

  const handleExit = (href: string = "/vocab") => {
    mutate("/api/vocab/due-count");
    router.push(href);
    router.refresh();
  };

  const isFixed = visualViewport !== null;
  const outerStyle = isFixed
    ? {
        position: "fixed" as const,
        top: `${visualViewport!.offsetTop}px`,
        left: 0,
        right: 0,
        height: `${visualViewport!.height}px`,
        zIndex: 50,
      }
    : undefined;

  // Finished Screen / Empty Session
  if (isFinished || questions.length === 0) {
    const totalAnswered = sessionResults.length;
    const correctCount = sessionResults.filter((r) => r.isCorrect).length;
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 100;

    return (
      <div
        className={`${isFixed ? "" : "h-dvh"} w-full flex justify-center bg-slate-50 dark:bg-slate-900`}
        style={outerStyle}
      >
        <div className="p-4 w-full max-w-[480px] flex flex-col justify-between h-full overflow-y-auto pb-10">
          <div className="space-y-6 pt-8">
            <div className="text-center space-y-3">
              <button
                onClick={() => {
                  soundEffects.playSuccessChime();
                  fireCompletionConfetti();
                }}
                className="w-20 h-20 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto shadow-inner animate-bounce active:scale-95 transition-transform cursor-pointer"
                title="Nhấn để phát lại hiệu ứng chúc mừng"
              >
                <Trophy className="w-10 h-10" />
              </button>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                {totalAnswered > 0 ? "Hoàn thành phiên ôn tập!" : "Chưa có từ nào cần ôn"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                {totalAnswered > 0
                  ? "Bộ não của bạn vừa kích hoạt lại các liên kết thần kinh cho các từ vựng này."
                  : "Tất cả từ vựng đang ở chu kỳ ghi nhớ tốt hoặc bạn chưa lưu từ vựng nào."}
              </p>
            </div>

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

          <div className="space-y-2 pt-6">
            <button
              onClick={() => handleExit("/vocab")}
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold rounded-2xl transition-all text-xs shadow-sm flex items-center justify-center gap-2 active:scale-98"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Về Kho Từ Vựng</span>
            </button>
            <button
              onClick={() => handleExit("/apps/story-shadowing")}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all text-xs flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Tiếp tục luyện Story Shadowing</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);


  return (
    // Outer: Fixed overlay hoặc static fallback
    <div
      className={`${isFixed ? "" : "h-dvh"} w-full flex justify-center bg-slate-50 dark:bg-slate-900`}
      style={outerStyle}
    >
      {/* Inner: Actual quiz layout container */}
      <div className="flex flex-col p-4 w-full max-w-[480px] overflow-hidden h-full">
      {/* Top Header Bar */}
      <div className="space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleExit("/vocab")}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
            title="Thoát phiên ôn tập"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{currentQ.quizMode === "cloze" ? "Cloze Sentence" : "FSRS Quiz"}</span>
          </div>

          <div className="text-xs font-bold text-slate-400">
            {currentIndex + 1} / {questions.length}
          </div>
        </div>

        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question View Container (Scrollable if soft keyboard shrinks viewport) */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-start py-2 no-scrollbar">
        {currentQ.quizMode === "cloze" ? (
          <ClozeCard
            question={currentQ}
            isAnswered={isAnswered}
            onSubmitAnswer={handleSubmitCloze}
          />
        ) : (
          <MCQCard
            question={currentQ}
            selectedOptionId={selectedOptionId}
            isAnswered={isAnswered}
            onSelectOption={handleSelectOption}
          />
        )}
      </div>

      {/* Feedback Drawer */}
      {isAnswered && currentResult && (
        <QuizFeedback
          question={currentQ}
          result={currentResult}
          completedSentence={completedSentence}
        />
      )}

      {/* Bottom Continue Button */}
      {isAnswered && (
        <div className="pt-2 shrink-0">
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
    </div>
  );
}
