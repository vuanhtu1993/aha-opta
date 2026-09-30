# AI Coding Agent Context Routing Rules: AhaTools

> **Objective:** Enforce Just-in-Time (JIT) context loading discipline for all AI Coding Agents (Claude, Gemini, Copilot, Cursor).  
> **Core Principle:** NEVER load the entire `requirements/` directory into context at once. Prevent context window pollution and *Lost in the Middle* failures.  
> **Repository:** `aha-tools` (`aha-opta`)

---

## 🧭 Task-to-Context Mapping Matrix

| Specific Role / Engineering Task | Mandatory Files to Load | Optional Files (As Needed) | Strictly FORBIDDEN to Load |
|---|---|---|---|
| **LangGraph Agent Development** (`src/lib/agents/`) | 1. `requirements/global/business-rules.md`<br>2. `requirements/modules/<module>/spec.md`<br>3. `requirements/governance/adr/003-langgraph-agent-orchestration.md` | `requirements/modules/<module>/api-contract.md` | Unrelated UI CSS styling, other modules' `acceptance-criteria.md` |
| **SRS Engine & Quiz Logic** (`src/lib/srs/`, `src/app/api/vocab/`) | 1. `requirements/global/business-rules.md`<br>2. `requirements/modules/vocab/api-contract.md`<br>3. `requirements/governance/adr/002-fsrs-spaced-repetition.md` | `requirements/global/domain-models.md` | `opta/`, `white-noise/` micro-specs |
| **Web Audio Sound Synthesis** (`src/app/apps/white-noise/`) | 1. `requirements/modules/white-noise/spec.md`<br>2. `requirements/modules/white-noise/api-contract.md`<br>3. `requirements/governance/adr/004-web-audio-api-synthesis.md` | `requirements/global/business-rules.md` | Backend Mongoose schema files, external API keys |
| **Frontend UI & Mobile Shell** (`src/components/`, `src/app/`) | 1. `requirements/modules/<module>/api-contract.md`<br>2. `requirements/modules/<module>/spec.md` | `requirements/governance/nfr.md` (Usability) | Backend raw scraper scripts, database internal connection code |
| **Database Schema & Mongoose Models** (`src/lib/db/models/`) | 1. `requirements/global/domain-models.md`<br>2. `requirements/governance/adr/005-mongodb-fact-opinion-split.md` | `requirements/global/business-rules.md` | Client React components, Tailwind styling |
| **QA Verification & Acceptance Testing** | 1. `requirements/modules/<module>/acceptance-criteria.md`<br>2. `requirements/modules/<module>/api-contract.md` | `requirements/global/business-rules.md` | Unrelated module specifications |
| **Architecture Audit & Change Requests** | 1. `requirements/governance/adr/`<br>2. `requirements/governance/traceability-matrix.md` | `requirements/governance/nfr.md` | Granular unit test fixtures |

---

## ⛔ Forbidden Actions & Violations

1. **No Greedy Context Dumping:** Do not execute blanket glob patterns like `cat requirements/**/*.md` to ingest all documentation into prompt context at once.
2. **No Arbitrary Business Invariant Alterations:** If a discrepancy is found between code and [`global/business-rules.md`](../../requirements/global/business-rules.md), prompt the user for clarification rather than silently relaxing the business invariant.
3. **No Unilateral Architectural Overrides:** Prior to suggesting alternative libraries (e.g., swapping `ts-fsrs` for SM-2, or introducing an ORM over Mongoose), consult [`governance/adr/`](../../requirements/governance/adr/README.md) for binding precedent decisions.

---

*Made by Anh Tu - Share to be share*
