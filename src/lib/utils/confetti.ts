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
      brand.colors.primary,    // Amber (#FFBA49)
      brand.colors.accentTeal, // Teal (#4FB5B5)
      brand.colors.accentGold, // Gold (#FDC425)
      "#10B981",               // Emerald Green
    ],
    disableForReducedMotion: true,
  });
}
