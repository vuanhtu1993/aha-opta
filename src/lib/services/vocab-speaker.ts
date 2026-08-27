/**
 * VocabSpeaker - High-Performance Native Speech Synthesis Service
 * 
 * Direct Web Speech API Architecture (<20ms Latency):
 * - Instant zero-network audio synthesis using device-native speech engine
 * - Pre-selected high quality English voices (en-US / en-GB)
 * - Zero external API dependency, zero CORS / AbortError issues
 */

export class VocabSpeaker {
  private static instance: VocabSpeaker | null = null;

  private cachedVoice: SpeechSynthesisVoice | null = null;
  private isInitialized = false;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): VocabSpeaker {
    if (!VocabSpeaker.instance) {
      VocabSpeaker.instance = new VocabSpeaker();
    }
    return VocabSpeaker.instance;
  }

  /**
   * Pre-load English voices asynchronously (handles browser delay for voiceschanged)
   */
  public init(): void {
    if (this.isInitialized || typeof window === "undefined") return;
    this.isInitialized = true;

    if ("speechSynthesis" in window) {
      this.pickEnglishVoice();
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        this.pickEnglishVoice();
      });
    }
  }

  private pickEnglishVoice(): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      const enVoice =
        voices.find((v) => v.lang === "en-US" && (v.name.includes("Natural") || v.name.includes("Google"))) ||
        voices.find((v) => v.lang === "en-US" && v.name.includes("Samantha")) ||
        voices.find((v) => v.lang === "en-US" && v.localService) ||
        voices.find((v) => v.lang.startsWith("en-US")) ||
        voices.find((v) => v.lang.startsWith("en-GB")) ||
        voices.find((v) => v.lang.startsWith("en"));

      if (enVoice) {
        this.cachedVoice = enVoice;
      }
    } catch (err) {
      console.warn("[VocabSpeaker] Error picking voice:", err);
    }
  }

  /**
   * Stop any active SpeechSynthesis utterance
   */
  public cancel(): void {
    if (typeof window === "undefined") return;

    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore errors
      }
    }
  }

  /**
   * Speak a word instantly using native Web Speech API (<20ms latency)
   */
  public speak(word: string, _audioUrl?: string): void {
    if (!word || typeof window === "undefined") return;

    const trimmedWord = word.trim();
    if (!trimmedWord) return;

    if (!("speechSynthesis" in window)) {
      console.warn("[VocabSpeaker] Web Speech API not supported in this browser.");
      return;
    }

    try {
      // Clear any pending queue for instant playback
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(trimmedWord);
      utterance.lang = "en-US";
      utterance.rate = 0.95; // Clear, natural pedagogical pronunciation speed

      // Lazy check voice if not cached yet
      if (!this.cachedVoice) {
        this.pickEnglishVoice();
      }

      if (this.cachedVoice) {
        utterance.voice = this.cachedVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("[VocabSpeaker] Web Speech failed:", err);
    }
  }
}

export const vocabSpeaker = VocabSpeaker.getInstance();

