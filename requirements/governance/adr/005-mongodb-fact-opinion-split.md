# ADR-005: Separation of Objective Facts (Match) and Subjective Opinions (Prediction)

> **Status:** `Accepted`  
> **Date:** 2026-09-30  
> **Author:** Anh Tú (Technical Architect)  
> **Mapped Constraint:** `CON-05`

---

## 1. Context & Problem Statement

In sports analytics applications, systems often conflate the factual sporting fixture with the analytical forecast:
- Storing AI predictions directly inside the `Match` document creates high write contention when multiple agents or model runs evaluate the same game.
- AI predictions can be inaccurate, whereas official match scores and historical statistics are objective, immutable facts.
- A single match may be evaluated multiple times across different AI prompt versions, LLM models, or market odds movements.

We need a database schema design that strictly preserves the integrity of historical facts while allowing rich, versioned, and auditable AI forecasting.

---

## 2. Decision Outcome

Adopt a **Strict Fact-versus-Opinion Collection Separation**:
1. **`Match` Collection (Objective Facts):** Contains verified data points (teams, official scores, kickoff date, venue, xG, possession). Once a match reaches `status: finished`, this record becomes immutable.
2. **`Prediction` Collection (Subjective Opinions):** Each record references a `matchId` and contains:
   - Specific `modelVersion` identifier (e.g., `gemini-2.5-flash@opta-v1`).
   - Predicted probabilities (`home`, `draw`, `away`), predicted score, confidence, and reasoning.
   - Snapshot of market odds and contextual form at the exact moment of prediction.
   - Deferred back-testing fields (`actualOutcome`, `isCorrect`) populated only after match completion.

---

## 3. Consequences & Trade-offs

### Positive Impacts (+):
* **Multi-Model Back-Testing:** Enables running comparative accuracy benchmarks across multiple LLM models and prompts on identical match sets.
* **Auditability & Integrity:** Historical market odds and team form snapshots remain preserved even if team ratings fluctuate later.
* **Zero Contention:** ETL fixtures synchronization runs independently of AI prediction pipelines.

### Negative Impacts & Costs (-):
* **Read Query Population:** Querying a match alongside its latest prediction requires a secondary query or MongoDB `$lookup` / Mongoose `.populate()`.

---

*Made by Anh Tu - Share to be share*
