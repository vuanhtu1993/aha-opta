"use client";

/**
 * @file use-vocab-save.ts
 * @description Custom Hook đồng bộ và quản lý trạng thái lưu từ vựng/collocation vào kho SRS.
 * Kết nối trực tiếp với backend qua POST /api/vocab/check và POST /api/vocab.
 * 
 * Mapped Spec: FR-VOCAB-06 | US-VOCAB-03 | BR-08
 * Made by Anh Tu - Share to be share
 */

import { useState, useEffect, useCallback, useMemo } from "react";

export interface SaveWordInput {
  word: string;
  ipa?: string;
  explanation: string;
  level?: string;
  sourceStorybookId?: string;
  sourceStorybookTitle?: string;
}

export function useVocabSave(initialWords: string[] = []) {
  // Tập hợp các từ đã tồn tại trong SRS (chuẩn hóa lowercase để so khớp không phân biệt hoa/thường)
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  // Tập hợp các từ đang trong tiến trình gửi HTTP request lưu
  const [savingWords, setSavingWords] = useState<Set<string>>(new Set());

  // Chuẩn hóa danh sách từ cần kiểm tra để tránh re-trigger effect vô tận
  const serializedWords = useMemo(() => {
    return Array.from(
      new Set(
        initialWords
          .map((w) => w?.trim().toLowerCase())
          .filter(Boolean)
      )
    ).sort().join(",");
  }, [initialWords]);

  /**
   * Đồng bộ trạng thái ban đầu:
   * Kiểm tra xem các từ/collocation trong bài tập đã được học viên lưu trước đó chưa
   */
  useEffect(() => {
    if (!serializedWords) return;

    const wordsToCheck = serializedWords.split(",");
    let isCancelled = false;

    const checkSavedWords = async () => {
      try {
        const res = await fetch("/api/vocab/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ words: wordsToCheck }),
        });

        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && Array.isArray(data.savedWords)) {
            setSavedWords((prev) => {
              const next = new Set(prev);
              data.savedWords.forEach((w: string) => next.add(w.toLowerCase()));
              return next;
            });
          }
        }
      } catch (err) {
        console.warn("[useVocabSave] Lỗi khi kiểm tra từ vựng đã lưu:", err);
      }
    };

    checkSavedWords();

    return () => {
      isCancelled = true;
    };
  }, [serializedWords]);

  /**
   * Kiểm tra nhanh một từ/cụm từ đã lưu trong kho hay chưa (0ms lookup)
   */
  const isSaved = useCallback(
    (word: string) => {
      if (!word) return false;
      return savedWords.has(word.trim().toLowerCase());
    },
    [savedWords]
  );

  /**
   * Kiểm tra một từ có đang trong trạng thái gửi request lưu hay không
   */
  const isSaving = useCallback(
    (word: string) => {
      if (!word) return false;
      return savingWords.has(word.trim().toLowerCase());
    },
    [savingWords]
  );

  /**
   * 1-Tap Save: Lưu từ vựng hoặc collocation vào bảng vocab_cards
   * Kèm cơ chế Optimistic Update để UI phản hồi tức thì
   */
  const saveWord = useCallback(
    async (input: SaveWordInput): Promise<boolean> => {
      const cleanKey = input.word.trim().toLowerCase();
      if (!cleanKey || savedWords.has(cleanKey)) return true;

      setSavingWords((prev) => new Set(prev).add(cleanKey));

      try {
        const res = await fetch("/api/vocab", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word: input.word.trim(),
            ipa: input.ipa,
            explanation: input.explanation || input.word,
            level: input.level || "B1",
            sourceStorybookId: input.sourceStorybookId,
            sourceStorybookTitle: input.sourceStorybookTitle,
          }),
        });

        if (res.ok) {
          // Lưu thành công -> Đánh dấu từ đã lưu vĩnh viễn
          setSavedWords((prev) => new Set(prev).add(cleanKey));
          return true;
        } else {
          console.error("[useVocabSave] Lưu từ thất bại:", res.statusText);
          return false;
        }
      } catch (err) {
        console.error("[useVocabSave] Lỗi mạng khi lưu từ:", err);
        return false;
      } finally {
        setSavingWords((prev) => {
          const next = new Set(prev);
          next.delete(cleanKey);
          return next;
        });
      }
    },
    [savedWords]
  );

  return {
    isSaved,
    isSaving,
    saveWord,
    savedCount: savedWords.size,
  };
}
