# Governance — Requirements Traceability Matrix (RTM): AhaTools

> **Parent Document:** [Requirement Analysis Package](../README.md)  
> **Version:** 1.0 (Baseline)  
> **Repository:** `aha-tools` (`aha-opta`)

---

## 1. Definition Anatomy

> **Requirements Traceability Matrix (RTM)** is *a comprehensive bi-directional mapping grid* that correlates Business Goals, Functional Requirements (FR), User Stories (US), Acceptance Criteria (AC), API/Interface Contracts, and Code Implementations.

### Anatomical Keyword Breakdown:
* **Forward Traceability:** Confirms that 100% of defined business requirements are realized in API endpoints and validated by acceptance criteria.
* **Backward Traceability:** Confirms that no orphaned endpoints or features exist in code without an explicit business justification.

---

## 2. Comprehensive Traceability Grid

| FR ID | Module Spec | User Story | Acceptance Criteria | API / Interface Contract | Primary Code Location | Status |
|---|---|---|---|---|---|---|
| **FR-VOCAB-01** | [Vocab Spec](../modules/vocab/spec.md) | `US-VOCAB-01` | [`AC-VOCAB-01`](../modules/vocab/acceptance-criteria.md#ac-vocab-01) | [`GET /api/vocab/due-count`](../modules/vocab/api-contract.md#11-get-apivocabdue-count) | `src/app/api/vocab/due-count/route.ts` | ✅ Implemented |
| **FR-VOCAB-02** | [Vocab Spec](../modules/vocab/spec.md) | `US-VOCAB-01` | [`AC-VOCAB-02`](../modules/vocab/acceptance-criteria.md#ac-vocab-02) | [`GET /api/vocab/review-session`](../modules/vocab/api-contract.md#12-get-apivocabreview-session) | `src/lib/srs/review-session.service.ts` | ✅ Implemented |
| **FR-VOCAB-03** | [Vocab Spec](../modules/vocab/spec.md) | `US-VOCAB-01` | [`AC-VOCAB-03`](../modules/vocab/acceptance-criteria.md#ac-vocab-03), [`AC-VOCAB-04`](../modules/vocab/acceptance-criteria.md#ac-vocab-04) | [`POST /api/vocab/review`](../modules/vocab/api-contract.md#13-post-apivocabreview) | `src/app/api/vocab/review/route.ts` | ✅ Implemented |
| **FR-VOCAB-04** | [Vocab Spec](../modules/vocab/spec.md) | `US-VOCAB-02` | [`AC-VOCAB-05`](../modules/vocab/acceptance-criteria.md#ac-vocab-05) | [`POST /api/vocab/generate-cloze-batch`](../modules/vocab/api-contract.md#14-post-apivocabgenerate-cloze-batch) | `src/app/api/vocab/generate-cloze-batch/route.ts` | ✅ Implemented |
| **FR-VOCAB-05** | [Vocab Spec](../modules/vocab/spec.md) | `US-VOCAB-01` | [`AC-VOCAB-01`](../modules/vocab/acceptance-criteria.md#ac-vocab-01) | [`GET /api/vocab/audio`](../modules/vocab/api-contract.md#15-get-apivocabaudio) | `src/app/api/vocab/audio/route.ts` | ✅ Implemented |
| **FR-VOCAB-06** | [Vocab Spec](../modules/vocab/spec.md) | `US-VOCAB-03` | [`AC-VOCAB-06`](../modules/vocab/acceptance-criteria.md#ac-vocab-06), [`AC-VOCAB-07`](../modules/vocab/acceptance-criteria.md#ac-vocab-07) | [`GET /api/vocab/speak-your-mind`](../modules/vocab/api-contract.md#16-get-apivocabspeak-your-mind) | `src/app/vocab/speak-your-mind/` | ✅ Implemented |
| **FR-VOCAB-07** | [Vocab Spec](../modules/vocab/spec.md) | `US-VOCAB-04` | [`AC-VOCAB-08`](../modules/vocab/acceptance-criteria.md#ac-vocab-08), [`AC-VOCAB-09`](../modules/vocab/acceptance-criteria.md#ac-vocab-09), [`AC-VOCAB-10`](../modules/vocab/acceptance-criteria.md#ac-vocab-10) | [`POST /api/agents/speaking-quiz/jobs`](../modules/vocab/speaking-quiz-api-contract.md#21-kích-hoạt-job-sinh-câu-hỏi-speaking-quiz), [`GET .../progress`](../modules/vocab/speaking-quiz-api-contract.md#22-lắng-nghe-tiến-trình-thời-gian-thực-qua-sse) | `aha-mind-agents` / `src/components/vocab/speaking/` | 🔄 Ready for Integration |
| **FR-SHADOW-01** | [Shadow Spec](../modules/story-shadowing/spec.md) | `US-SHADOW-01` | [`AC-SHADOW-01`](../modules/story-shadowing/acceptance-criteria.md#ac-shadow-01) | [`GET /api/story-shadowing`](../modules/story-shadowing/api-contract.md#11-get-apistory-shadowing) | `src/app/api/story-shadowing/route.ts` | ✅ Implemented |
| **FR-SHADOW-02** | [Shadow Spec](../modules/story-shadowing/spec.md) | `US-SHADOW-01` | [`AC-SHADOW-02`](../modules/story-shadowing/acceptance-criteria.md#ac-shadow-02) | [`GET /api/story-shadowing/:id`](../modules/story-shadowing/api-contract.md#12-get-apistory-shadowingid) | `src/app/api/story-shadowing/[id]/route.ts` | ✅ Implemented |
| **FR-SHADOW-03** | [Shadow Spec](../modules/story-shadowing/spec.md) | `US-SHADOW-02` | [`AC-SHADOW-04`](../modules/story-shadowing/acceptance-criteria.md#ac-shadow-04) | [`POST /api/story-shadowing/youtube/suggest-segments`](../modules/story-shadowing/api-contract.md#13-post-apistory-shadowingyoutubesuggest-segments) | `src/app/api/story-shadowing/youtube/suggest-segments/route.ts` | ✅ Implemented |
| **FR-SHADOW-04** | [Shadow Spec](../modules/story-shadowing/spec.md) | `US-SHADOW-02` | [`AC-SHADOW-03`](../modules/story-shadowing/acceptance-criteria.md#ac-shadow-03) | [`POST /api/story-shadowing/youtube/create-series`](../modules/story-shadowing/api-contract.md#14-post-apistory-shadowingyoutubecreate-series) | `src/lib/agents/story-shadowing-agent/graph.ts` | ✅ Implemented |
| **FR-SHADOW-05** | [Shadow Spec](../modules/story-shadowing/spec.md) | `US-SHADOW-01` | [`AC-SHADOW-01`](../modules/story-shadowing/acceptance-criteria.md#ac-shadow-01) | [`DELETE /api/story-shadowing/:id`](../modules/story-shadowing/api-contract.md#15-delete-apistory-shadowingid) | `src/app/api/story-shadowing/[id]/route.ts` | ✅ Implemented |
| **FR-OPTA-01** | [Opta Spec](../modules/opta/spec.md) | `US-OPTA-01` | [`AC-OPTA-01`](../modules/opta/acceptance-criteria.md#ac-opta-01) | [`GET /api/opta/matches`](../modules/opta/api-contract.md#11-get-apioptamatches) | `src/app/api/opta/matches/route.ts` | ✅ Implemented |
| **FR-OPTA-02** | [Opta Spec](../modules/opta/spec.md) | `US-OPTA-01` | [`AC-OPTA-02`](../modules/opta/acceptance-criteria.md#ac-opta-02), [`AC-OPTA-03`](../modules/opta/acceptance-criteria.md#ac-opta-03) | [`POST /api/opta/predict`](../modules/opta/api-contract.md#12-post-apioptapredict) | `src/lib/agents/opta-agent/graph.ts` | ✅ Implemented |
| **FR-OPTA-03** | [Opta Spec](../modules/opta/spec.md) | `US-OPTA-02` | [`AC-OPTA-03`](../modules/opta/acceptance-criteria.md#ac-opta-03) | [`POST /api/opta/scrape/elo`](../modules/opta/api-contract.md#13-post-apioptascrapeelo) | `src/lib/services/elo-scraper.ts` | ✅ Implemented |
| **FR-OPTA-04** | [Opta Spec](../modules/opta/spec.md) | `US-OPTA-01` | [`AC-OPTA-04`](../modules/opta/acceptance-criteria.md#ac-opta-04) | [`POST /api/opta/sync`](../modules/opta/api-contract.md#14-post-apioptasync) | `src/app/api/opta/sync/route.ts` | ✅ Implemented |
| **FR-OPTA-05** | [Opta Spec](../modules/opta/spec.md) | `US-OPTA-01` | [`AC-OPTA-01`](../modules/opta/acceptance-criteria.md#ac-opta-01) | [`GET /api/opta/teams`](../modules/opta/api-contract.md#15-get-apioptateams) | `src/app/api/opta/teams/route.ts` | ✅ Implemented |
| **FR-NOISE-01** | [Noise Spec](../modules/white-noise/spec.md) | `US-NOISE-01` | [`AC-NOISE-01`](../modules/white-noise/acceptance-criteria.md#ac-noise-01), [`AC-NOISE-04`](../modules/white-noise/acceptance-criteria.md#ac-noise-04) | [`useNoiseGenerator.toggle()`](../modules/white-noise/api-contract.md#11-hook-interface-usenoisegenerator) | `src/app/apps/white-noise/useNoiseGenerator.ts` | ✅ Implemented |
| **FR-NOISE-02** | [Noise Spec](../modules/white-noise/spec.md) | `US-NOISE-01` | [`AC-NOISE-02`](../modules/white-noise/acceptance-criteria.md#ac-noise-02) | [`useNoiseGenerator.setNoiseType()`](../modules/white-noise/api-contract.md#11-hook-interface-usenoisegenerator) | `src/app/apps/white-noise/useNoiseGenerator.ts` | ✅ Implemented |
| **FR-NOISE-03** | [Noise Spec](../modules/white-noise/spec.md) | `US-NOISE-02` | [`AC-NOISE-03`](../modules/white-noise/acceptance-criteria.md#ac-noise-03) | [`useNoiseGenerator.setVolume()`](../modules/white-noise/api-contract.md#11-hook-interface-usenoisegenerator) | `src/app/apps/white-noise/useNoiseGenerator.ts` | ✅ Implemented |
| **FR-NOISE-04** | [Noise Spec](../modules/white-noise/spec.md) | `US-NOISE-02` | [`AC-NOISE-04`](../modules/white-noise/acceptance-criteria.md#ac-noise-04) | [`SettingsDrawer`](../modules/white-noise/api-contract.md#13-component-contract-settingsdrawer) | `src/app/apps/white-noise/components/SettingsDrawer.tsx` | ✅ Implemented |
| **FR-DASH-01** | [Dash Spec](../modules/dashboard/spec.md) | `US-DASH-01` | [`AC-DASH-01`](../modules/dashboard/acceptance-criteria.md#ac-dash-01) | `GreetingSection` | `src/components/dashboard/greeting-section.tsx` | ✅ Implemented |
| **FR-DASH-02** | [Dash Spec](../modules/dashboard/spec.md) | `US-DASH-01` | [`AC-DASH-01`](../modules/dashboard/acceptance-criteria.md#ac-dash-01) | [`DueReviewCard`](../modules/dashboard/api-contract.md#11-consumed-api-endpoints) | `src/components/dashboard/due-review-card.tsx` | ✅ Implemented |
| **FR-DASH-03** | [Dash Spec](../modules/dashboard/spec.md) | `US-DASH-01` | [`AC-DASH-02`](../modules/dashboard/acceptance-criteria.md#ac-dash-02) | [`ContinueLearning`](../modules/dashboard/api-contract.md#22-component-contract-continuelearning) | `src/components/dashboard/continue-learning.tsx` | ✅ Implemented |
| **FR-DASH-04** | [Dash Spec](../modules/dashboard/spec.md) | `US-DASH-02` | [`AC-DASH-03`](../modules/dashboard/acceptance-criteria.md#ac-dash-03), [`AC-DASH-04`](../modules/dashboard/acceptance-criteria.md#ac-dash-04) | [`MobileTabBar`](../modules/dashboard/api-contract.md#21-component-contract-mobiletabbar) | `src/components/mobile-shell/mobile-tab-bar.tsx` | ✅ Implemented |
| **FR-DASH-05** | [Dash Spec](../modules/dashboard/spec.md) | `US-DASH-01` | [`AC-DASH-01`](../modules/dashboard/acceptance-criteria.md#ac-dash-01) | `PWARegister` | `src/components/mobile-shell/pwa-register.tsx` | ✅ Implemented |

---

*Made by Anh Tu - Share to be share*
