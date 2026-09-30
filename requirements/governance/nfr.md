# Governance — Non-Functional Requirements (NFR): AhaTools

> **Parent Document:** [Requirement Analysis Package](../README.md)  
> **Version:** 1.0 (Baseline)  
> **Repository:** `aha-tools` (`aha-opta`)

---

## 1. Non-Functional Requirements Matrix

| ID | Category | Requirement Detail | Measurement Target | Technical Strategy & Implementation |
|---|---|---|---|---|
| **NFR-01** | **Performance** | API & Audio Latency | API p95 $\le 500\text{ms}$; Audio start $\le 50\text{ms}$; FSRS math $\le 10\text{ms}$ | Client-side Web Audio API synthesis; Next.js edge caching; indexed MongoDB queries (`fsrs.due`). |
| **NFR-02** | **Security** | Secret Isolation & Boundary Defense | 0 server secrets leaked to browser bundle | Strict separation of `"use client"` files; all API keys (`GOOGLE_CLOUD_TTS_KEY`, `TAVILY_API_KEY`, `MONGODB_URI`) consumed exclusively in server Route Handlers. |
| **NFR-03** | **Concurrency & ACID** | Flashcard Log Atomicity | Zero orphaned review logs or corrupt FSRS states | Atomic Mongoose `$set` on `VocabCard` and synchronous insert into `VocabReviewLog` within single review cycle. |
| **NFR-04** | **Scalability** | Stateless Service Architecture | Support 1,000+ concurrent active learners | Stateless Next.js route handlers; global MongoDB connection caching singleton (`src/lib/db/mongoose.ts`) preventing socket exhaustion. |
| **NFR-05** | **Reliability** | Fallback & Fault Tolerance | 99.9% quiz generation availability | 3-tier distractor fallback hierarchy: if personal and storybook pools are exhausted, fallback to default CEFR bank (`getRandomDefaultDistractors`). |
| **NFR-06** | **Maintainability** | Clean Module Decoupling | High cohesion, zero circular dependencies | Strict module clustering: `src/lib/agents/`, `src/lib/srs/`, `src/lib/db/models/`, and `src/components/` decoupled via typed interfaces. |
| **NFR-07** | **Portability** | Mobile PWA Compatibility | 100% responsive across mobile viewports (360px–480px) | PWA Service Worker (`public/sw.js`); standalone display mode; viewport safe-area insets padding (`env(safe-area-inset-bottom)`). |
| **NFR-08** | **Usability** | Audio De-Popping & Accessibility | Zero audible clicking noise during volume modulation; WCAG 2.1 AA | Web Audio API exponential ramp (`gainNode.gain.setTargetAtTime(target, t, 0.015)`); high-contrast text and IPA phonetic clarity. |
| **NFR-09** | **Observability** | Real-Time AI Pipeline Telemetry | $<1\text{s}$ latency for user progress updates | Server-Sent Events (SSE) streaming through `src/lib/utils/sse-wrapper.ts` emitting live step checkpoints during LangGraph execution. |
| **NFR-10** | **Testability** | Deterministic Algorithmic Verification | 100% test coverage for FSRS scheduling and probability math | Isolated pure unit test suites for `ts-fsrs` state transitions, odds conversions, and probability conservation invariants. |

---

*Made by Anh Tu - Share to be share*
