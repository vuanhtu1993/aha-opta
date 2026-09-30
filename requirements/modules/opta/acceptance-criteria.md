# Module OPTA — Acceptance Criteria (Gherkin & Boundary Rules)

> **Parent Document:** [Module Spec](spec.md) | [Requirement Analysis Package](../../README.md)  
> **Module ID:** `OPTA` | **Target Audience:** Product Owner, Developer, QA Automation  
> **Linked Documents:** [API Contract](api-contract.md)

---

## 1. Purpose & Boundary Derivation

Acceptance Criteria define the exact boundary conditions governing **Sports Predictive Intelligence**, **LangGraph Prediction Execution**, and **Fact-Opinion Segregation**, directly enforcing [`BR-04`](../../global/business-rules.md#br-04) and [`BR-05`](../../global/business-rules.md#br-05).

---

## 2. Acceptance Scenarios (Gherkin)

### AC-OPTA-01: Match Retrieval & Relationship Population
- **Target User Story:** [`US-OPTA-01`](spec.md#us-opta-01)
- **Target API:** [`GET /api/opta/matches`](api-contract.md#11-get-apioptamatches)

```gherkin
Scenario: Query scheduled fixtures with populated team names
  Given the database contains scheduled matches referencing Team documents
  When the analyst requests "GET /api/opta/matches?status=scheduled"
  Then the response status is 200 OK
    And each match object contains populated "homeTeam" and "awayTeam" records
    And neither "homeTeam" nor "awayTeam" is null or an unpopulated ObjectId
```

---

### AC-OPTA-02: Prediction Probability Conservation Invariant
- **Target User Story:** [`US-OPTA-01`](spec.md#us-opta-01)
- **Target API:** [`POST /api/opta/predict`](api-contract.md#12-post-apioptapredict)
- **Governing Business Rule:** [`BR-05`](../../global/business-rules.md#br-05)

```gherkin
Scenario: Enforce probability sum to 100% on AI prediction
  Given a scheduled match between two existing teams
  When the analyst initiates "POST /api/opta/predict" with the match ID
  Then the response status is 200 OK
    And the sum of "probabilities.home", "probabilities.draw", and "probabilities.away" is between 99.9% and 100.1%
    And each individual probability value is >= 0 and <= 100
    And "confidence" is a decimal between 0.0 and 1.0
```

---

### AC-OPTA-03: Fact Preservation Guarantee
- **Target User Story:** [`US-OPTA-01`](spec.md#us-opta-01)
- **Target API:** [`POST /api/opta/predict`](api-contract.md#12-post-apioptapredict)
- **Governing Business Rule:** [`BR-04`](../../global/business-rules.md#br-04)

```gherkin
Scenario: Prevent modification of match facts during prediction
  Given a scheduled match with initial homeScore = null, venue = "MetLife Stadium"
  When "POST /api/opta/predict" is executed successfully
  Then a new document is created in the "predictions" collection
    And the corresponding document in "matches" remains completely unchanged in scores, venue, and status
```

---

### AC-OPTA-04: Post-Match Result Synchronization & Back-Testing
- **Target User Story:** [`US-OPTA-01`](spec.md#us-opta-01)
- **Target API:** [`POST /api/opta/sync`](api-contract.md#14-post-apioptasync)
- **Governing Business Rule:** [`BR-04`](../../global/business-rules.md#br-04)

```gherkin
Scenario: Evaluate prediction accuracy upon match finalization
  Given a match with an existing prediction forecasting "home" victory
  When the system posts official result: homeScore = 3, awayScore = 1, status = "finished"
  Then the match status transitions to "finished"
    And the prediction record updates "actualOutcome" to "home"
    And "isCorrect" is set to true
```

---

*Made by Anh Tu - Share to be share*
