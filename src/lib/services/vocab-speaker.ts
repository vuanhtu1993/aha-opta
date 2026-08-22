/**
 * VocabSpeaker - Centralized Audio & Speech Synthesis Service
 * 
 * 3-Tier Audio Architecture:
 * 1. Tier 1: Direct MP3 URL playback (if audioUrl provided)
 * 2. Tier 2: Server Proxy lookup (/api/vocab/audio?word=...) + In-memory caching
 * 3. Tier 3: Web Speech API with pre-loaded & cached English voices (en-US / en-GB)
 */

export class VocabSpeaker {
  private static instance: VocabSpeaker | null = null;

  private cachedVoice: SpeechSynthesisVoice | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private audioUrlCache: Map<string, string | null> = new Map();
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
   * Stop any currently playing HTML Audio or SpeechSynthesis utterance
   */
  public cancel(): void {
    if (typeof window === "undefined") return;

    // Stop HTML Audio
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (err) {
        // Ignore abort errors
      }
      this.currentAudio = null;
    }

    // Stop Web Speech Synthesis
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        // Ignore errors
      }
    }
  }

  /**
   * Speak a word using 3-tier fallback strategy
   */
  public async speak(word: string, audioUrl?: string): Promise<void> {
    if (!word || typeof window === "undefined") return;

    const trimmedWord = word.trim();
    if (!trimmedWord) return;

    // 0. Cancel any playing audio before starting new playback
    this.cancel();

    // 1. Tier 1: Direct MP3 URL playback
    if (audioUrl && audioUrl.startsWith("http") && audioUrl !== "undefined") {
      const played = await this.playAudioUrl(audioUrl);
      if (played) return;
    }

    // 2. Tier 2: Server Proxy lookup (/api/vocab/audio?word=...)
    const proxyPlayed = await this.playServerProxyAudio(trimmedWord);
    if (proxyPlayed) return;

    // 3. Tier 3: Web Speech API Fallback
    this.speakWebSpeech(trimmedWord);
  }

  private playAudioUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const audio = new Audio(url);
        this.currentAudio = audio;

        audio.onended = () => {
          this.currentAudio = null;
          resolve(true);
        };

        audio.onerror = (err) => {
          console.warn("[VocabSpeaker] Audio URL failed, falling back:", url, err);
          this.currentAudio = null;
          resolve(false);
        };

        audio
          .play()
          .then(() => resolve(true))
          .catch((err) => {
            console.warn("[VocabSpeaker] Play promise rejected, falling back:", err);
            this.currentAudio = null;
            resolve(false);
          });
      } catch (err) {
        console.warn("[VocabSpeaker] Audio init failed:", err);
        this.currentAudio = null;
        resolve(false);
      }
    });
  }

  private async playServerProxyAudio(word: string): Promise<boolean> {
    const cacheKey = word.toLowerCase();

    // Check in-memory cache
    if (this.audioUrlCache.has(cacheKey)) {
      const cachedUrl = this.audioUrlCache.get(cacheKey);
      if (cachedUrl) {
        return this.playAudioUrl(cachedUrl);
      }
      return false; // Cache explicitly recorded no audioUrl
    }

    try {
      const res = await fetch(`/api/vocab/audio?word=${encodeURIComponent(word)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.audioUrl) {
          this.audioUrlCache.set(cacheKey, data.audioUrl);
          return this.playAudioUrl(data.audioUrl);
        }
      }
      // Record null in cache to avoid repeated failed API calls for same word
      this.audioUrlCache.set(cacheKey, null);
    } catch (err) {
      console.warn("[VocabSpeaker] Server proxy lookup failed:", err);
    }

    return false;
  }

  private speakWebSpeech(word: string): void {
    if (!("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.9;

      // Re-check voice in case loaded lazily
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
