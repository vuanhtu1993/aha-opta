# ADR-007: Asynchronous Speaking Quiz Generation via aha-mind-agents (BullMQ + SSE)

> **Status:** `Accepted`  
> **Date:** 2026-10-01  
> **Author:** Anh Tú (IT Lecturer / Technical Architect)  
> **Mapped Constraint:** `CON-07`

---

## 1. Context & Problem Statement

Generating an argumentative speaking challenge with a rigorous 4-stage PREP scaffold (Point, Reason, Example, Conclusion) requires invoking LLMs (e.g. Gemini 2.5 Flash) across multiple chained steps:
1. Resolving pedagogical lesson context or custom topic.
2. Formulating an engaging debate dilemma.
3. Synthesizing vocabulary-aligned PREP hints, signposts, and model answers.
4. Validating strict JSON schema conformity with Zod.

This multi-step pipeline incurs a latency of **10 to 25 seconds**. Executing this synchronously within Next.js Server Actions or standard API route handlers causes critical architectural failures:
- **HTTP 504 Gateway Timeout:** Cloudflare, Vercel, and reverse proxies aggressively terminate HTTP connections exceeding 10–15s.
- **Degraded Learner Experience:** The client UI freezes without intermediate progress feedback, leading to multiple impatient re-clicks and duplicate API executions.
- **Wasted Token Cost:** Repeating identical generations for the same Storybook lesson drains expensive LLM quota.

---

## 2. Decision Outcome

Offload Speaking Quiz generation to the dedicated `aha-mind-agents` microservice using an **Asynchronous Queue + Server-Sent Events (SSE) + Idempotency Cache** architecture:
1. **Asynchronous Handshake via BullMQ:**
   - Client triggers generation via `POST /api/agents/speaking-quiz/jobs`.
   - The Gateway checks MongoDB (`speaking_questions`) for an existing `storybookId`. If found and `forceRegenerate=false`, it returns HTTP 202 with `status: completed` and `existingQuestionId` in `< 50ms` (Idempotent Cache Hit).
   - If cold or forced, it pushes a Job into the Redis-backed BullMQ queue (`speaking-quiz-queue`) and returns HTTP 202 with `status: queued` and `sseUrl`.
2. **Real-time Pipeline Transparency via SSE:**
   - The client connects to `GET /api/agents/speaking-quiz/jobs/:jobId/progress` (`Accept: text/event-stream`).
   - The LangGraph worker publishes granular progress events (`context_resolved: 25%`, `question_formulated: 50%`, `prep_synthesized: 80%`, `completed: 100%`).
   - When the terminal event (`status: done`) is emitted with `payload.questionId`, the client cleanly terminates the `EventSource` connection and fetches the final question document.
3. **Decoupled Service Boundary:**
   - `aha-tools` acts solely as the consumer/client, maintaining zero direct dependency on BullMQ/Redis worker orchestration.

---

## 3. Consequences & Trade-offs

### Positive Impacts (+):
* **Zero Timeout Failures:** Long-running LLM generation is completely isolated from HTTP timeout limits.
* **Instant Recall (< 50ms):** Repeated visits to the same Storybook lesson load existing questions instantly with 0 LLM token cost.
* **Visual Polish & Trust:** Real-time progress bars keep the learner informed and engaged during the 10–25s waiting window.
* **Resilient Rate Limit Handling:** BullMQ handles LLM rate limits (HTTP 429) automatically via exponential backoff retries without dropping user jobs.

### Negative Impacts & Costs (-):
* **Infrastructure Dependency:** Requires running Redis and BullMQ worker infrastructure alongside MongoDB and Next.js.
* **State Synchronization:** Phased client architecture requires managing EventSource lifecycles, reconnection fallback, and error banners in React.

---

*Made by Anh Tu - Share to be share*
