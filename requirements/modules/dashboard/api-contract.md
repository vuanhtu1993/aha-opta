# Module DASHBOARD — Component & Client API Contract

> **Parent Document:** [Module Spec](spec.md) | [Requirement Analysis Package](../../README.md)  
> **Module ID:** `DASH` | **Scope:** Shell Layout, Navigation Contracts & Consumed Endpoints  
> **Linked Documents:** [Acceptance Criteria](acceptance-criteria.md)

---

## 1. Consumed Backend APIs

The Dashboard module acts as an aggregator consuming endpoints from the `VOCAB` and `STORY-SHADOWING` domains:

### 1.1 Consumed API Endpoints
| Endpoint | Method | Source Module | Query / Payload | Dashboard Usage |
|---|---|---|---|---|
| `/api/vocab/due-count` | `GET` | `VOCAB` | None | Updates `DueReviewCard` and `MobileTabBar` badge indicator |
| `/api/story-shadowing` | `GET` | `SHADOW` | None | Feeds `ContinueLearning` (latest item) and `RecentStories` (first 6 items) |

---

## 2. Shell & Component Contracts

### 2.1 Component Contract: `MobileTabBar`
- **File Reference:** `src/components/mobile-shell/mobile-tab-bar.tsx`
- **Behavioral Contract:**
  * Displays 4 primary tabs:
    1. **Home (`/`):** Exact route match.
    2. **Story (`/apps/story-shadowing`):** Prefix match.
    3. **Vocab (`/vocab`):** Prefix match + Dynamic due count badge indicator.
    4. **Profile (`/profile`):** Prefix match.
  * **Fullscreen Suppression:** Automatically returns `null` (unmounts) when the current route begins with:
    - `/apps/story-shadowing/player/`
    - `/apps/story-shadowing/create/`
    - `/vocab/review`
  * **Footer Attribution:** Strictly displays `"Made by Anh Tu - Share to be share"` centered below the navigation icons.

---

### 2.2 Component Contract: `ContinueLearning`
- **File Reference:** `src/components/dashboard/continue-learning.tsx`

```typescript
export interface ContinueLearningProps {
  latestStory: {
    _id: string;
    title: string;
    level: "easy" | "medium" | "hard";
    sentenceCount?: number;
    sourceType: "text" | "youtube";
  } | null;
}
```

---

### 2.3 PWA Manifest Specification
- **File Reference:** `src/app/manifest.ts`

```typescript
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AhaTools - Multimodal Learning Hub",
    short_name: "AhaTools",
    description: "Spaced Repetition, Shadowing, Sports AI & Procedural Noise",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#f59e0b",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
```

---

*Made by Anh Tu - Share to be share*
