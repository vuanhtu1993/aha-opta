# Module VOCAB — Acceptance Criteria (Gherkin & Boundary Rules)

> **Parent Document:** [Module Spec](spec.md) | [Requirement Analysis Package](../../README.md)  
> **Module ID:** `VOCAB` | **Target Audience:** Product Owner, Developer, QA Automation  
> **Linked Documents:** [API Contract](api-contract.md)

---

## 1. Purpose & Boundary Derivation

Acceptance Criteria define the exact boundary conditions governing the **Spaced Repetition Engine** and **Adaptive Quiz Experience**, directly enforcing [`BR-01`](../../global/business-rules.md#br-01), [`BR-02`](../../global/business-rules.md#br-02), and [`BR-03`](../../global/business-rules.md#br-03).

---

## 2. Acceptance Scenarios (Gherkin)

### AC-VOCAB-01: Accurate Due Review Counter
- **Target User Story:** [`US-VOCAB-01`](spec.md#us-vocab-01)
- **Target API:** [`GET /api/vocab/due-count`](api-contract.md#11-get-apivocabdue-count)
- **Governing Business Rule:** [`BR-01`](../../global/business-rules.md#br-01)

```gherkin
Scenario: Retrieve accurate count of overdue cards
  Given the database contains 5 cards with "fsrs.due" <= current timestamp
    And the database contains 10 cards with "fsrs.due" > current timestamp
  When the client sends a request to "GET /api/vocab/due-count"
  Then the response status is 200 OK
    And the payload field "dueCount" equals 5
    And the payload field "totalCount" equals 15
```

---

### AC-VOCAB-02: Dynamic Quiz Generation with Distinct Distractors
- **Target User Story:** [`US-VOCAB-01`](spec.md#us-vocab-01)
- **Target API:** [`GET /api/vocab/review-session`](api-contract.md#12-get-apivocabreview-session)
- **Governing Business Rule:** [`BR-02`](../../global/business-rules.md#br-02), [`BR-03`](../../global/business-rules.md#br-03)

```gherkin
Scenario: Assemble quiz questions with 1 correct answer and 3 unique distractors
  Given there are at least 5 due vocabulary cards in the system
  When a learner requests "GET /api/vocab/review-session?limit=5"
  Then the response status is 200 OK
    And each item in "questions" has exactly 4 options labeled "A", "B", "C", "D"
    And exactly 1 option has "isCorrect" equal to true
    And 3 options have "isCorrect" equal to false
    And none of the distractor options match the target card explanation
```

```gherkin
Scenario: Adaptively assign Cloze mode to matured cards
  Given a card has "fsrs.reps" >= 2
    And the card contains at least 1 item in "exampleSentences"
  When "GET /api/vocab/review-session" generates this card
  Then the "quizMode" field is set to "cloze"
    And the "exampleSentences" array is provided with maskable sentences
```

---

### AC-VOCAB-03: Successful Review Submission & State Mutation
- **Target User Story:** [`US-VOCAB-01`](spec.md#us-vocab-01)
- **Target API:** [`POST /api/vocab/review`](api-contract.md#13-post-apivocabreview)
- **Governing Business Rule:** [`BR-01`](../../global/business-rules.md#br-01)

```gherkin
Scenario: Successfully submit review rating "Good"
  Given an existing card with stability 2.0 and reps 1
  When the user submits a review with rating 3 (Good) and responseTimeMs 3500
  Then the response status is 200 OK
    And the card "fsrs.reps" increments to 2
    And the card "fsrs.due" is updated to a future date beyond current timestamp
    And a new document is inserted into "vocab_review_logs" with matching responseTimeMs
```

---

### AC-VOCAB-04: Rejection of Invalid Review Ratings
- **Target User Story:** [`US-VOCAB-01`](spec.md#us-vocab-01)
- **Target API:** [`POST /api/vocab/review`](api-contract.md#13-post-apivocabreview)
- **Governing Business Rule:** [`BR-01`](../../global/business-rules.md#br-01)

```gherkin
Scenario: Reject out-of-bounds rating parameter
  Given an existing card ID
  When the user submits "POST /api/vocab/review" with rating 5
  Then the response status is 400 Bad Request
    And the card state in the database remains unmodified
    And no review log document is created
```

---

### AC-VOCAB-05: Batch Cloze Generation
- **Target User Story:** [`US-VOCAB-02`](spec.md#us-vocab-02)
- **Target API:** [`POST /api/vocab/generate-cloze-batch`](api-contract.md#14-post-apivocabgenerate-cloze-batch)

```gherkin
Scenario: Enrich cards lacking example sentences
  Given 3 cards exist without example sentences
  When a curator posts to "/api/vocab/generate-cloze-batch" with limit 3
  Then the response status is 200 OK
    And the processed cards now each contain at least 1 item in "exampleSentences"
    And each sentence contains the target word as the exact "answer" field
```

---

*Made by Anh Tu - Share to be share*
