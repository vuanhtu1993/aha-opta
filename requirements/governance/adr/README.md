# Architecture Decision Records (ADR) Repository: AhaTools

> **Parent Document:** [Requirement Analysis Package](../../README.md)  
> **Standard:** Michael Nygard / MADR (Markdown Architecture Decision Records)  
> **Governance:** Architectural Invariants & Pedagogical Rationale

---

## 1. Definition Anatomy

> **Architecture Decision Record (ADR)** is *a software design document* that captures a significant architectural choice made along with its context, options considered, decision outcome, and positive/negative trade-offs.

### Anatomical Keyword Breakdown:
* **Context:** The technical dilemma, forces, and historical constraints necessitating a decision.
* **Decision Outcome:** The explicit technology, library, or design pattern selected (*Why over What*).
* **Consequences & Trade-offs:** The acknowledged costs, limitations, and benefits incurred.

---

## 2. Architecture Decision Records Index

| Record | Decision Title | Status | Approval Date | Key Problem Addressed |
|---|---|---|---|---|
| [ADR-001](001-nextjs-app-router-react19.md) | Next.js 16 App Router & React 19 Full-Stack Architecture | `Accepted` | 2026-09-30 | Unifying micro-apps under a single high-performance full-stack boundary |
| [ADR-002](002-fsrs-spaced-repetition.md) | FSRS (Free Spaced Repetition Scheduler) over Legacy SM-2 | `Accepted` | 2026-09-30 | Eliminating "Ease Hell" and optimizing memory retention via DSR modeling |
| [ADR-003](003-langgraph-agent-orchestration.md) | Multi-Agent Orchestration via LangGraph StateGraph | `Accepted` | 2026-09-30 | Decomposing monolithic prompts into fault-tolerant, streaming pipelines |
| [ADR-004](004-web-audio-api-synthesis.md) | In-Browser Web Audio API Mathematical Synthesis for White Noise | `Accepted` | 2026-09-30 | Eliminating bandwidth cost and loop stutters via client-side synthesis |
| [ADR-005](005-mongodb-fact-opinion-split.md) | Separation of Objective Facts (Match) and Subjective Opinions (Prediction) | `Accepted` | 2026-09-30 | Isolating immutable sports results from AI predictions to enable back-testing |
| [ADR-006](006-prep-scaffolded-speaking-quiz.md) | PREP Framework & Progressive Model Disclosure for Speaking Quizzes | `Accepted` | 2026-09-30 | Scaffold-first speaking practice with zero-token local audio feedback |

---

*Made by Anh Tu - Share to be share*
