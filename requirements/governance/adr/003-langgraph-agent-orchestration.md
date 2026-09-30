# ADR-003: Multi-Agent Orchestration via LangGraph StateGraph

> **Status:** `Accepted`  
> **Date:** 2026-09-30  
> **Author:** Anh Tú (Technical Architect)  
> **Mapped Constraint:** `CON-03`

---

## 1. Context & Problem Statement

Both the **Story Shadowing** and **Opta Sports Analytics** modules require complex, multi-stage processing:
- In Story Shadowing: Raw transcripts must be split into sentences, tagged with IPA, converted into TTS audio, scanned for CEFR keywords, and enriched with collocations and word families.
- In Opta: Match data must be fetched, recent form analyzed, web expert opinions searched via Tavily, and final probabilities computed via an LLM.

Using a single monolithic LLM prompt to perform all these tasks results in:
- High hallucination rates and output truncation.
- Zero fault isolation (if one subtask fails, the entire pipeline crashes).
- Inability to stream intermediate progress indicators to the user interface.

---

## 2. Decision Outcome

Adopt **`@langchain/langgraph`** with a typed `StateGraph` pattern:
1. **Discrete Modular Nodes:** Decompose business pipelines into single-responsibility nodes (e.g., `sentenceSplitterNode`, `ttsGeneratorNode`, `keywordEnricherNode` for Storybook; `dataFetcherNode`, `statsAnalyzerNode`, `expertOpinionNode`, `predictorNode` for Opta).
2. **Parallel Sub-Graph Execution:** In Storybook processing, branch execution into parallel paths from `START`:
   - Branch A: `sentenceSplitter` $\rightarrow$ `ttsGenerator` $\rightarrow$ `END`
   - Branch B: `keywordIdentifier` $\rightarrow$ `keywordEnricher` $\rightarrow$ `END`
3. **Progress Telemetry via SSE:** Stream graph execution chunks in real-time over HTTP Server-Sent Events (`src/lib/utils/sse-wrapper.ts`) to provide live UI feedback.

---

## 3. Consequences & Trade-offs

### Positive Impacts (+):
* **Deterministic Fault Recovery:** Individual nodes can retry failed external API calls (e.g., Gemini rate limit, Tavily timeout) without restarting the entire pipeline.
* **Observable Progress:** The UI renders an active step checklist indicating exactly which node is currently executing.
* **Independent Testability:** Nodes accept state and return partial state updates, making them easy to unit test.

### Negative Impacts & Costs (-):
* **Higher Structural Codebase Weight:** Introduces state type definitions, node implementations, and graph compilation files.
* **Dependency Footprint:** Requires `@langchain/core`, `@langchain/langgraph`, and `@langchain/google-genai`.

---

*Made by Anh Tu - Share to be share*
