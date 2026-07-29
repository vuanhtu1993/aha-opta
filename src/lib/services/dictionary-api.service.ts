export interface DictionaryResult {
  word: string;
  ipa: string | null;
  audioUrl: string | null;
  definitions: {
    partOfSpeech: string;
    definition: string;
    example?: string;
    synonyms: string[];
  }[];
}

/**
 * Lấy IPA từ mảng phonetics của Free Dictionary API
 */
function extractIpa(phonetics: any[]): string | null {
  if (!phonetics || phonetics.length === 0) return null;

  // Ưu tiên phonetic có text
  const withText = phonetics.find(p => p.text);
  if (withText) return withText.text;

  return null;
}

/**
 * Lấy audio url từ mảng phonetics
 */
function extractAudio(phonetics: any[]): string | null {
  if (!phonetics || phonetics.length === 0) return null;

  // Ưu tiên audio US hoặc UK, không quan trọng lắm, lấy cái đầu tiên có audio
  const withAudio = phonetics.find(p => p.audio && p.audio.length > 0);
  if (withAudio) return withAudio.audio;

  return null;
}

/**
 * Tra từ điển bằng Free Dictionary API
 * Có timeout 3 giây để không block luồng quá lâu.
 */
export async function lookupWord(word: string): Promise<DictionaryResult | null> {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 86400 } // Cache trên Next.js server 24h
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[DictionaryAPI] Missing word: ${word}`);
      } else {
        console.warn(`[DictionaryAPI] Error ${response.status} for word: ${word}`);
      }
      return null;
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const entry = data[0];

    // Parse definitions
    const definitions = [];
    for (const meaning of entry.meanings || []) {
      for (const def of meaning.definitions || []) {
        definitions.push({
          partOfSpeech: meaning.partOfSpeech || "",
          definition: def.definition || "",
          example: def.example,
          synonyms: [...(def.synonyms || []), ...(meaning.synonyms || [])],
        });
      }
    }

    return {
      word: entry.word,
      ipa: extractIpa(entry.phonetics) || entry.phonetic || null,
      audioUrl: extractAudio(entry.phonetics),
      definitions,
    };

  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.warn(`[DictionaryAPI] Timeout for word: ${word}`);
    } else {
      console.error(`[DictionaryAPI] Fetch error for word: ${word}`, err);
    }
    return null;
  }
}

/**
 * Batch lookup nhiều từ đồng thời
 */
export async function batchLookup(words: string[]): Promise<Array<DictionaryResult | null>> {
  const results = await Promise.allSettled(words.map(lookupWord));

  return results.map(result => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return null;
  });
}
