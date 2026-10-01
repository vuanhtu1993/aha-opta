# Nâng Cấp Speak Your Mind Thành Tab Độc Lập Trên Mobile Tab Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Nâng cấp tính năng **Speak Your Mind (`prep_speaking`)** từ chế độ ẩn bên trong Vocab thành một Tab điều hướng độc lập (First-Class Bottom Navigation Tab) trên `MobileTabBar` với icon `Mic`, tối ưu hóa trải nghiệm một chạm (One-tap Access), cô lập trạng thái active giữa `/vocab` và `/vocab/speak-your-mind`, và đồng bộ hóa toàn bộ đặc tả yêu cầu trong Requirements Package.

**Architecture:**
1. **Requirements & Governance Layer:** Cập nhật `FR-DASH-04`, `US-DASH-02`, `AC-DASH-04`, `MobileTabBar` component contract và `change-log.md` (CR-03) từ 4 tabs lên 5 tabs chuẩn mực di động (`Home`, `Story`, `Speak`, `Vocab`, `Profile`).
2. **Presentation / Navigation Shell:** Nâng cấp `src/components/mobile-shell/mobile-tab-bar.tsx`:
   - Thêm tab `Speak` với biểu tượng `Mic` (`lucide-react`).
   - Cải tiến thuật toán khớp tuyến đường `isActive` nhằm đảm bảo khi người học ở `/vocab/speak-your-mind` thì chỉ duy nhất tab `Speak` sáng đèn, tab `Vocab` không bị sáng đèn kép.
3. **Player Layout Optimization:** Điều chỉnh `SpeakYourMindPlayer.tsx`:
   - Thay thế nút quay lại "Back to Vocab" bằng Header thương hiệu tính năng phù hợp với vị thế của một màn hình Tab cấp 1.
   - Bổ sung khoảng đệm an toàn phía đáy màn hình (`pb-24`) để không bị che khuất bởi `MobileTabBar`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Lucide Icons (`Mic`), SWR.

---

### Task 1: Cập Nhật Hệ Thống Yêu Cầu Phân Tầng (Requirements Package v1.3 - CR-03)

**Files:**
- Modify: `requirements/modules/dashboard/spec.md`
- Modify: `requirements/modules/dashboard/api-contract.md`
- Modify: `requirements/modules/dashboard/acceptance-criteria.md`
- Modify: `requirements/governance/traceability-matrix.md`
- Modify: `requirements/governance/change-log.md`

- [x] **Step 1: Cập nhật `requirements/modules/dashboard/spec.md` (FR-DASH-04 & US-DASH-02)**

Cập nhật mô tả `FR-DASH-04` hỗ trợ 5 tabs (`Home`, `Story`, `Speak`, `Vocab`, `Profile`) và điều chỉnh User Story `US-DASH-02`.

- [x] **Step 2: Cập nhật `requirements/modules/dashboard/api-contract.md`**

Đặc tả mảng `TABS` trong `MobileTabBar` component contract gồm 5 phần tử:
```typescript
interface TabItem {
  label: "Home" | "Story" | "Speak" | "Vocab" | "Profile";
  href: string;
  icon: React.ComponentType;
  exactMatch?: boolean;
}
```

- [x] **Step 3: Cập nhật `requirements/modules/dashboard/acceptance-criteria.md`**

Cập nhật `AC-DASH-04` với kịch bản Gherkin kiểm thử trạng thái cô lập:
- Khi truy cập `/vocab/speak-your-mind`, tab `Speak` có trạng thái active (màu amber, scale-110), tab `Vocab` không active.
- Khi truy cập `/vocab` hoặc `/vocab/review`, tab `Vocab` active, tab `Speak` không active.

- [x] **Step 4: Cập nhật `traceability-matrix.md` và `change-log.md`**

Ghi nhận bản phát hành **v1.3 (CR-03)**: Thêm Tab `Speak` vào thanh điều hướng di động `MobileTabBar`.

- [x] **Step 5: Commit task**

```bash
git add requirements/
git commit -m "docs(dashboard): update specifications for 5-tab mobile navigation with Speak tab"
```

---

### Task 2: Cập Nhật Component `MobileTabBar` Với Tab "Speak" & Logic Active Cô Lập

**Files:**
- Modify: `src/components/mobile-shell/mobile-tab-bar.tsx`

- [x] **Step 1: Cập nhật `src/components/mobile-shell/mobile-tab-bar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Mic, GraduationCap, Settings } from "lucide-react";
import useSWR from "swr";
import { cn } from "@/lib/utils";

interface TabItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exactMatch?: boolean;
}

const TABS: TabItem[] = [
  {
    label: "Home",
    href: "/",
    icon: Home,
    exactMatch: true,
  },
  {
    label: "Story",
    href: "/apps/story-shadowing",
    icon: BookOpen,
    exactMatch: false,
  },
  {
    label: "Speak",
    href: "/vocab/speak-your-mind",
    icon: Mic,
    exactMatch: false,
  },
  {
    label: "Vocab",
    href: "/vocab",
    icon: GraduationCap,
    exactMatch: false,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: Settings,
    exactMatch: false,
  },
];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MobileTabBar() {
  const pathname = usePathname();

  // Fetch due count for Vocab tab badge
  const { data: dueData } = useSWR("/api/vocab/due-count", fetcher, {
    revalidateOnFocus: true,
    revalidateOnMount: true,
    dedupingInterval: 5000,
  });

  const dueCount = dueData?.dueCount ?? 0;

  // Ẩn tab bar ở các trang tạo/chi tiết/player/quiz review để nhường toàn bộ không gian
  const isHidden =
    pathname.startsWith("/apps/story-shadowing/player") ||
    pathname.startsWith("/apps/story-shadowing/create") ||
    pathname.startsWith("/vocab/review");
  if (isHidden) return null;

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 pt-2 pb-[max(0.5rem,calc(env(safe-area-inset-bottom,0px)+0.25rem))] shadow-lg"
    >
      <div className="flex items-center justify-around">
        {TABS.map((tab) => {
          // Logic kiểm tra active cô lập đường dẫn:
          // 1. Tab Speak: Active khi ở /vocab/speak-your-mind
          // 2. Tab Vocab: Active khi ở /vocab nhưng KHÔNG ở /vocab/speak-your-mind
          // 3. Tab khác: Khớp theo exactMatch hoặc startsWith
          let isActive = false;
          if (tab.href === "/vocab/speak-your-mind") {
            isActive = pathname.startsWith("/vocab/speak-your-mind");
          } else if (tab.href === "/vocab") {
            isActive =
              (pathname === "/vocab" || pathname.startsWith("/vocab/")) &&
              !pathname.startsWith("/vocab/speak-your-mind");
          } else if (tab.exactMatch) {
            isActive = pathname === tab.href;
          } else {
            isActive = pathname.startsWith(tab.href);
          }

          const Icon = tab.icon;
          const isVocabTab = tab.href === "/vocab";

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 gap-1 min-w-[56px]",
                isActive
                  ? "text-amber-500 font-bold dark:text-amber-400"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <div
                className={cn(
                  "relative p-1 rounded-lg transition-transform",
                  isActive ? "scale-110 bg-amber-50 dark:bg-amber-950/40" : ""
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 sm:w-6 sm:h-6",
                    isActive ? "stroke-[2.5]" : "stroke-[1.75]"
                  )}
                />

                {/* Badge indicator on Vocab tab */}
                {isVocabTab && dueCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-extrabold shadow-xs">
                    {dueCount > 99 ? "99+" : dueCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] leading-none tracking-tight">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Footer copyright */}
      <div className="pt-1 text-center text-[9px] tracking-wider text-slate-400 dark:text-slate-500 font-medium select-none">
        Made by Anh Tu - Share to be share
      </div>
    </nav>
  );
}
```

- [x] **Step 2: Kiểm tra biên dịch TypeScript**

Run: `npx tsc --noEmit`  
Expected: Exit code 0, không có lỗi type.

- [x] **Step 3: Commit task**

```bash
git add src/components/mobile-shell/mobile-tab-bar.tsx
git commit -m "feat(navigation): add Speak tab to MobileTabBar with isolated active state"
```

---

### Task 3: Tối Ưu Layout Và Top Bar Của `SpeakYourMindPlayer`

**Files:**
- Modify: `src/components/vocab/speaking/SpeakYourMindPlayer.tsx`

- [x] **Step 1: Cập nhật Header Top Bar và khoảng đệm đáy trang `SpeakYourMindPlayer.tsx`**

1. Thay thế nút quay lại `<Link href="/vocab">` bằng Header nhận diện tính năng:
```tsx
<div className="flex items-center gap-2">
  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
    <Mic className="w-4 h-4" />
  </div>
  <div>
    <h1 className="text-sm font-black text-slate-900 dark:text-white leading-none">
      Speak Your Mind
    </h1>
    <span className="text-[10px] font-medium text-slate-400">
      PREP Argumentation Challenge
    </span>
  </div>
</div>
```
2. Đổi khoảng đệm đáy container từ `pb-16` thành `pb-28` để nội dung không bao giờ bị che lấp bởi `MobileTabBar`.

- [x] **Step 2: Kiểm tra biên dịch TypeScript**

Run: `npx tsc --noEmit`  
Expected: Exit code 0, không có lỗi type.

- [x] **Step 3: Commit task**

```bash
git add src/components/vocab/speaking/SpeakYourMindPlayer.tsx
git commit -m "refactor(vocab): adjust SpeakYourMindPlayer top bar and bottom padding for bottom tab navigation"
```

---

### Task 4: Kiểm Thử Toàn Diện & Build Verification

**Files:**
- Test: Next.js Production Build

- [x] **Step 1: Chạy kiểm thử TypeScript toàn diện**

Run: `npx tsc --noEmit`  
Expected: Exit code 0.

- [x] **Step 2: Chạy kiểm thử đóng gói Next.js**

Run: `npm run build`  
Expected: Exit code 0, biên dịch 28/28 routes thành công.

- [x] **Step 3: Kiểm tra chuyển đổi Tab trên giao diện**

Xác nhận:
- `/` -> Tab Home active
- `/apps/story-shadowing` -> Tab Story active
- `/vocab/speak-your-mind` -> Tab Speak active (icon Mic), Tab Vocab không active
- `/vocab` -> Tab Vocab active, Tab Speak không active
- `/profile` -> Tab Profile active

---

*Made by Anh Tu - Share to be share*
