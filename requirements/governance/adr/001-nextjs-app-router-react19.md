# ADR-001: Next.js 16 App Router & React 19 Full-Stack Architecture

> **Status:** `Accepted`  
> **Date:** 2026-09-30  
> **Author:** Anh Tú (Technical Architect)  
> **Mapped Constraint:** `CON-01`

---

## 1. Context & Problem Statement

AhaTools integrates diverse micro-applications (SRS quiz player, speech shadowing player, football analytics dashboard, and ambient noise generator). Building this as separate micro-frontends or isolated frontend/backend repositories introduces:
- Deployment overhead and separate server maintenance.
- Cross-origin resource sharing (CORS) complexity and authentication session synchronization issues.
- Duplication of TypeScript domain models across client and server.

We need a unified, high-performance web architecture that enables fast server-side data fetching, zero-bundle-size server utilities, and rich interactive client-side audio/video components.

---

## 2. Decision Outcome

Adopt **Next.js 16 with App Router and React 19** as the monolithic full-stack framework:
1. **Server Components (`RSC`):** Default for initial data rendering (e.g., initial storybook lists, team tables, metadata generation) without shipping server libraries to client bundles.
2. **Client Components (`"use client"`):** Dedicated to interactive widgets requiring browser APIs (Web Audio API, YouTube IFrame player, Zustand stores, and Confetti animations).
3. **Route Handlers (`app/api/**/route.ts`):** Direct serverless HTTP endpoints connecting to MongoDB, executing LangGraph pipelines, and streaming Server-Sent Events (SSE).

---

## 3. Consequences & Trade-offs

### Positive Impacts (+):
* **Single Language & Type Sharing:** End-to-end TypeScript interfaces (`IVocabCard`, `IMatch`, `IStorybook`) shared between database models, API handlers, and React components.
* **Optimized PWA Performance:** Native Next.js image optimization, font optimization (Geist), route prefetching, and metadata API support.
* **Low Operational Overhead:** Deploys as a unified Vercel/Node.js application without separate backend hosting.

### Negative Impacts & Costs (-):
* **Next.js Hot-Reload Edge Cases:** Mongoose schemas must employ cache-deletion guards (`if (mongoose.models.X) delete mongoose.models.X`) to prevent duplicate model compilation errors during rapid local development.
* **Boundary Discipline:** Developers must strictly observe `"use client"` boundaries to prevent server secrets (`GOOGLE_CLOUD_TTS_KEY`, `MONGODB_URI`) from leaking into client browser bundles.

---

*Made by Anh Tu - Share to be share*
