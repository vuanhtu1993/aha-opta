# ADR-006: PREP Framework & Progressive Model Disclosure for Speaking Quizzes

> **Status:** `Accepted`  
> **Date:** 2026-09-30  
> **Author:** Anh Tú (IT Lecturer / Technical Architect)  
> **Mapped Constraint:** `CON-06`

---

## 1. Context & Problem Statement

Language learners frequently encounter severe **Cognitive Overload** during spontaneous speaking tasks. When presented with open-ended prompts without structural scaffolding:
- Beginners freeze, struggle with idea generation, or produce unstructured, rambling speech filled with hesitation markers (*"um", "ah"*).
- Attempts to implement real-time automated AI speech grading via external cloud LLMs encounter severe bottlenecks: free-tier API rate limits (RPM), token depletion, high latency ($3-8\text{s}$), and network dependency.
- Attempting to build automatic question extraction from Storybooks at the same time as the Quiz Player violates the **Separation of Concerns** principle, making it difficult to validate learner UX independently of AI prompt quality.

---

## 2. Decision Outcome

Adopt a decoupled, scaffolded speaking quiz architecture named **"Speak Your Mind"** (technical mode: `prep_speaking`):
1. **PREP Structural Discipline:** Enforce a strict 4-step argumentative chain: **Point (P) $\rightarrow$ Reason (R) $\rightarrow$ Example (E) $\rightarrow$ Conclusion Point (P)** within a 30–60 second window.
2. **Progressive Model Disclosure (Scaffold-First):**
   - **Practice Phase:** Display the prompt question, mandatory target vocabulary, and 4 PREP cards containing *only* structural hints and signpost discourse markers (e.g., *"In my opinion...", "Because...", "For instance...", "Therefore..."*).
   - **Reflection Phase:** Model answers are strictly concealed by default. Learners must attempt speaking first before unlocking the full model answer accordion on demand.
3. **Zero-Token Local Audio:** Integrate native browser speech synthesis (`SpeechSynthesisUtterance` via `src/lib/services/vocab-speaker.ts`) to read model answers aloud with zero cloud API overhead.
4. **Decoupled Phased Implementation:** Implement question modeling and player UX first (using structured seed questions), validating the interactive experience before connecting automated extraction pipelines from Storybooks.

---

## 3. Consequences & Trade-offs

### Positive Impacts (+):
* **Pedagogical Metacognition:** By forcing the learner to speak *before* viewing the model answer, the brain actively struggles with sentence formulation (Active Production) before comparing against native phrasing.
* **Zero Runtime Cost:** Delivers instantaneous feedback and audio playback ($<20\text{ms}$) with 0 external API calls during quiz execution.
* **Independent Testability:** The Speaking Quiz Player can be fully tested, benchmarked, and tuned with deterministic mock questions before introducing AI generative variability.

### Negative Impacts & Costs (-):
* **Self-Directed Evaluation in MVP:** In Version 01, the system does not score the learner's spoken audio automatically; learners rely on qualitative comparison against the model answer.

---

*Made by Anh Tu - Share to be share*
