# Design Spec: Quiz Completion UX Upgrade (Sound & Confetti Effects)

## 1. Overview & Goal

Nâng cấp trải nghiệm người dùng (UX) khi hoàn thành phiên ôn tập Từ vựng (`/vocab/review`) bằng hiệu ứng thính giác (Minimalist Chime Sound) và thị giác (Brand-colored Confetti Burst) nhẹ nhàng, mang lại cảm giác tưởng thưởng và đạt thành tựu (Dopamine reward) mà không gây rườm rà hay nặng ứng dụng.

---

## 2. Architecture & Components

```
src/
├── lib/
│   ├── services/
│   │   └── sound-effects.ts      # [NEW] Web Audio API Synthesizer (Zero-asset sound)
│   └── utils/
│       └── confetti.ts           # [NEW] Canvas Confetti wrapper với Brand Colors
└── components/
    └── vocab/
        └── review/
            └── QuizPlayer.tsx    # [MODIFY] Trigger hiệu ứng khi finishes quiz
```

---

## 3. Detailed Specifications

### 3.1 Web Audio Synthesizer (`sound-effects.ts`)
- **Thuật toán:** Sử dụng `AudioContext` native của trình duyệt để tạo âm thanh tổng hợp (Programmatic Synthesizer).
- **Âm thanh "Minimalist Success Chime":**
  - **Tone 1:** Tần số 1318.51 Hz (Nốt $E_6$), phát trong 0.08 giây.
  - **Tone 2:** Tần số 1760.00 Hz (Nốt $A_6$), phát nối tiếp và ngân nhẹ trong 0.25 giây với dốc suy hao lũy thừa (`exponentialRampToValueAtTime`).
- **Xử lý An toàn (Resilience):** Tự động khởi tạo `AudioContext` và `resume()` nếu ở trạng thái `suspended` (chính sách bảo mật WebKit/iOS Safari).

### 3.2 Confetti Burst (`confetti.ts`)
- **Thư viện:** `canvas-confetti` (nhẹ, render bằng HTML5 Canvas 60fps).
- **Cấu hình Pháo Hạt:**
  - `particleCount`: 40 hạt (vừa đủ rực rỡ, không che khuất chữ).
  - `spread`: 65 độ.
  - `startVelocity`: 30.
  - `origin`: `{ y: 0.55 }` (Phun từ khu vực chiếc Cúp Vàng ở giữa màn hình).
  - `colors`: `['#FFBA49', '#4FB5B5', '#FDC425', '#10B981']` (Trích xuất từ Brand Tokens `brand.colors`).

### 3.3 QuizPlayer Integration (`QuizPlayer.tsx`)
- Khi state `isFinished` chuyển sang `true` (và `totalAnswered > 0`):
  1. Phát hiệu ứng âm thanh `soundEffects.playSuccessChime()`.
  2. Phun pháo hạt `fireCompletionConfetti()`.

---

## 4. Verification Plan

### Automated Checks
- `npx tsc --noEmit` để đảm bảo type checking hoàn toàn hợp lệ.

### Manual Verification
- Thực hiện 1 phiên ôn tập từ vựng ngẫu nhiên.
- Khi bấm nút "Xem kết quả tổng kết" câu cuối cùng:
  - Kiểm tra tiếng "Ting" hai âm sắc ngân vang nhẹ nhàng.
  - Kiểm tra pháo hạt phả ra từ giữa màn hình với dải màu Amber/Teal/Gold.
  - Kiểm tra trên iOS Safari (không bị delay hay giật lag).
