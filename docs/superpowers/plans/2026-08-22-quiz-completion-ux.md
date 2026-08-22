# Quiz Completion UX Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Quiz completion UX in `/vocab/review` by adding a zero-asset minimalist chime sound (Web Audio API) and a lightweight brand-colored confetti burst (`canvas-confetti`).

**Architecture:** Create a `SoundEffectsService` singleton for programmatically synthesizing sound without asset files, a `ConfettiService` utility wrapper for `canvas-confetti` configured with brand tokens, and integrate both into `QuizPlayer.tsx` when `isFinished` state triggers.

**Tech Stack:** Next.js 16, React 19, TypeScript, Web Audio API, `canvas-confetti`.

---

### Task 1: Install `canvas-confetti` Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install `canvas-confetti` and `@types/canvas-confetti`**

Run command:
```bash
pnpm add canvas-confetti && pnpm add -D @types/canvas-confetti
```

- [ ] **Step 2: Commit dependency installation**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add canvas-confetti dependency"
```

---

### Task 2: Implement Web Audio Synthesizer (`sound-effects.ts`)

**Files:**
- Create: `src/lib/services/sound-effects.ts`

- [ ] **Step 1: Create `src/lib/services/sound-effects.ts`**

```typescript
/**
 * @file sound-effects.ts
 * @description Web Audio API Synthesizer cho các hiệu ứng âm thanh micro-interaction.
 * Zero-asset dependency (không cần file .mp3), phát âm thanh tức thì không độ trễ.
 *
 * Made by Anh Tu - Share to be share
 */

class SoundEffectsService {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  /**
   * Phát tiếng chime "Ting" kép chúc mừng hoàn thành (E6 -> A6)
   */
  public playSuccessChime(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1: E6 (1318.51 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1318.51, now);

      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.12);

      // Note 2: A6 (1760.00 Hz) - Phát sau 0.06s
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1760.0, now + 0.06);

      gain2.gain.setValueAtTime(0.2, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.06);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn("Could not play sound effect", e);
    }
  }
}

export const soundEffects = new SoundEffectsService();
```

- [ ] **Step 2: Check TypeScript types**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit sound-effects service**

```bash
git add src/lib/services/sound-effects.ts
git commit -m "feat: add Web Audio API sound effects service"
```

---

### Task 3: Implement Confetti Utility Wrapper (`confetti.ts`)

**Files:**
- Create: `src/lib/utils/confetti.ts`

- [ ] **Step 1: Create `src/lib/utils/confetti.ts`**

```typescript
import confetti from "canvas-confetti";
import { brand } from "@/lib/config/brand";

/**
 * Phun pháo hạt mừng hoàn thành phiên ôn tập với màu thương hiệu Aha-Mind
 */
export function fireCompletionConfetti(): void {
  if (typeof window === "undefined") return;

  confetti({
    particleCount: 40,
    spread: 65,
    startVelocity: 30,
    origin: { y: 0.55 },
    colors: [
      brand.colors.primary,      // Amber (#FFBA49)
      brand.colors.accentTeal,   // Teal (#4FB5B5)
      brand.colors.accentGold,   // Gold (#FDC425)
      "#10B981",                 // Emerald Green
    ],
    disableForReducedMotion: true,
  });
}
```

- [ ] **Step 2: Check TypeScript types**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit confetti utility**

```bash
git add src/lib/utils/confetti.ts
git commit -m "feat: add brand-colored completion confetti utility"
```

---

### Task 4: Integrate Sound & Confetti in `QuizPlayer.tsx`

**Files:**
- Modify: `src/components/vocab/review/QuizPlayer.tsx`

- [ ] **Step 1: Add completion effect trigger in `QuizPlayer.tsx`**

Import `soundEffects` and `fireCompletionConfetti`:
```typescript
import { soundEffects } from "@/lib/services/sound-effects";
import { fireCompletionConfetti } from "@/lib/utils/confetti";
```

Add `useEffect` to trigger effects when session finishes with answers:
```typescript
  useEffect(() => {
    if (isFinished && sessionResults.length > 0) {
      soundEffects.playSuccessChime();
      fireCompletionConfetti();
    }
  }, [isFinished, sessionResults.length]);
```

- [ ] **Step 2: Check TypeScript types**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit `QuizPlayer.tsx` update**

```bash
git add src/components/vocab/review/QuizPlayer.tsx
git commit -m "feat(vocab/review): trigger sound chime and confetti on quiz completion"
```

---

### Task 5: Final Verification

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 2: Run production build check**

Run: `pnpm build`
Expected: Successful build without errors.
