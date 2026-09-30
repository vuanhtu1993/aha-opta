# ADR-002: FSRS (Free Spaced Repetition Scheduler) over Legacy SM-2

> **Status:** `Accepted`  
> **Date:** 2026-09-30  
> **Author:** Anh Tú (Technical Architect)  
> **Mapped Constraint:** `CON-02`

---

## 1. Context & Problem Statement

Language vocabulary retention requires an optimal spaced repetition scheduling algorithm. 
- The legacy **SuperMemo SM-2** algorithm (used in early Anki versions) relies on rigid, heuristic ease-factor multipliers. It is infamous for the **"Ease Hell"** problem (where cards that lapse repeatedly become permanently stuck with overly frequent reviews).
- SM-2 assumes reviews happen exactly on schedule, producing erratic interval adjustments when a learner reviews late or early.

We need a mathematically grounded cognitive scheduling model that accurately models forgetting probability and dynamically calculates intervals.

---

## 2. Decision Outcome

Adopt **FSRS (Free Spaced Repetition Scheduler)** via the TypeScript library **`ts-fsrs`**:
1. **DSR Memory Modeling:** Tracks three psychological memory parameters:
   - **Difficulty ($D \in [1, 10]$):** How inherently hard the knowledge item is.
   - **Stability ($S$ in days):** The duration required for memory retrievability to drop from 100% to 90%.
   - **Retrievability ($R$):** The probability of recalling the item at a given time point $t$: $R(t) = \left(1 + \text{factor} \cdot \frac{t}{S}\right)^{-\text{power}}$.
2. **Immutable Review Logging:** Every rating submission (`1: Again`, `2: Hard`, `3: Good`, `4: Easy`) creates an immutable `VocabReviewLog` entry capturing pre-review state, response time, and post-review stability.

---

## 3. Consequences & Trade-offs

### Positive Impacts (+):
* **Superior Retention Efficiency:** Studies show FSRS achieves target retention (typically 90%) with 20% to 30% fewer reviews compared to SM-2.
* **Resilience to Irregular Review Patterns:** Calculates true interval expansion even when learners miss review sessions for days or weeks.
* **Data-Rich State:** The embedded `fsrs` document provides deep analytics on memory health (`reps`, `lapses`, `stability`, `difficulty`).

### Negative Impacts & Costs (-):
* **Schema Overhead:** Requires persisting 9 fields inside `FSRSCardState` per card rather than SM-2's simpler interval and ease factor.
* **Higher Computational Complexity:** Calculating state transitions requires logarithmic floating-point operations rather than simple integer multiplication.

---

*Made by Anh Tu - Share to be share*
