import confetti from "canvas-confetti";
import { brand } from "@/lib/config/brand";

/**
 * Phun pháo hạt mừng hoàn thành phiên ôn tập với màu thương hiệu Aha-Mind
 */
export function fireCompletionConfetti(): void {
  if (typeof window === "undefined") return;

  try {
    confetti({
      particleCount: 50,
      spread: 70,
      startVelocity: 35,
      origin: { y: 0.6 },
      zIndex: 9999,
      colors: [
        brand.colors.primary,    // Amber (#FFBA49)
        brand.colors.accentTeal, // Teal (#4FB5B5)
        brand.colors.accentGold, // Gold (#FDC425)
        "#10B981",               // Emerald Green
      ],
      disableForReducedMotion: true,
    });
  } catch (e) {
    console.warn("Could not fire completion confetti", e);
  }
}
