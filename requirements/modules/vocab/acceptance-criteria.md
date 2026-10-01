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

### AC-VOCAB-06: Scaffolded PREP Display & Concealed Model Answer
- **Target User Story:** [`US-VOCAB-03`](spec.md#us-vocab-03)
- **Target API:** [`GET /api/vocab/speak-your-mind`](api-contract.md#16-get-apivocabspeak-your-mind)
- **Governing Business Rule:** [`BR-08`](../../global/business-rules.md#br-08)

```gherkin
Scenario: Render speaking challenge with concealed model answers by default
  Given a valid speaking question is retrieved
  When the learner opens the "Speak Your Mind" quiz interface
  Then the dilemma question and target vocabulary words are visible
    And 4 PREP cards are displayed with guiding signposts and conceptual hints
    And all 4 model answer texts remain completely hidden from view
    And a 30-60 second practice timer control is ready for interaction
```

```gherkin
Scenario: Reveal model answer on learner demand
  Given the learner has finished self-directed speaking practice
  When the learner taps the "Mở bài mẫu đối chiếu" (Reveal Model Answer) button
  Then all 4 model sentences (Point, Reason, Example, Conclusion) become visible
    And signpost discourse markers and target vocabulary terms are highlighted
    And speaker playback buttons are rendered for each sentence
```

---

### AC-VOCAB-07: Offline Speech Synthesis Playback for Model Sentences
- **Target User Story:** [`US-VOCAB-03`](spec.md#us-vocab-03)
- **Target Contract:** `VocabSpeaker.speak()` via Web Speech API

```gherkin
Scenario: Play model answer audio using native browser Web Speech API
  Given the model answer is revealed on screen
  When the learner clicks the speaker button next to a model sentence
  Then "window.speechSynthesis.speak" is triggered with "en-US" language setting
    And clear native audio plays through the device speakers
    And exactly 0 network requests are made to external audio servers
```

---

### AC-VOCAB-08: Asynchronous Speaking Quiz Job Creation & Idempotency Cache Hit
- **Target User Story:** [`US-VOCAB-04`](spec.md#us-vocab-04)
- **Target API:** [`POST /api/agents/speaking-quiz/jobs`](speaking-quiz-api-contract.md#21-kích-hoạt-job-sinh-câu-hỏi-speaking-quiz)
- **Governing Business Rule:** [`BR-09`](../../global/business-rules.md#br-09)

```gherkin
Scenario: Enqueue new background job when no question exists for storybookId
  Given a valid "storybookId" that has no existing record in "speaking_questions"
  When the client sends "POST /api/agents/speaking-quiz/jobs" with "forceRegenerate: false"
  Then the response status is 202 Accepted
    And the response body contains "status" equal to "queued"
    And the response body contains a valid "jobId"
    And the response body contains a valid "sseUrl" string matching "/api/agents/speaking-quiz/jobs/:jobId/progress"
```

```gherkin
Scenario: Instant cache hit when question exists in database and forceRegenerate is false
  Given an existing question in "speaking_questions" with id "6abdc5cae5d0b4f316e5516c" for "storybookId"
  When the client sends "POST /api/agents/speaking-quiz/jobs" with this "storybookId" and "forceRegenerate: false"
  Then the response status is 202 Accepted
    And the response body contains "status" equal to "completed"
    And the response body contains "existingQuestionId" equal to "6abdc5cae5d0b4f316e5516c"
    And the response time is under 50 milliseconds
    And zero LLM tokens are consumed
```

```gherkin
Scenario: Force re-generation ignores existing database question
  Given an existing question in "speaking_questions" for "storybookId"
  When the client sends "POST /api/agents/speaking-quiz/jobs" with "forceRegenerate: true"
  Then the response status is 202 Accepted
    And the response body contains "status" equal to "queued"
    And a new job is dispatched to BullMQ
```

---

### AC-VOCAB-09: Real-Time SSE Pipeline Progress Streaming
- **Target User Story:** [`US-VOCAB-04`](spec.md#us-vocab-04)
- **Target API:** [`GET /api/agents/speaking-quiz/jobs/:jobId/progress`](speaking-quiz-api-contract.md#22-lắng-nghe-tiến-trình-thời-gian-thực-qua-sse)
- **Governing Business Rule:** [`BR-09`](../../global/business-rules.md#br-09)

```gherkin
Scenario: Receive progressive pipeline stages via SSE stream
  Given a queued speaking quiz job with ID "job-101"
  When the client opens an EventSource connection to "/api/agents/speaking-quiz/jobs/job-101/progress"
  Then the stream sequentially emits:
    | stepName             | progress | status    |
    | context_resolved     | 25       | completed |
    | question_formulated  | 50       | completed |
    | prep_synthesized     | 80       | completed |
    | completed            | 100      | completed |
  And the final event contains "status: done" and "payload.questionId"
  And the client closes the SSE connection immediately upon receiving "status: done"
```

---

### AC-VOCAB-10: Speaking Quiz Validation & Error Resilience
- **Target User Story:** [`US-VOCAB-04`](spec.md#us-vocab-04)
- **Target API:** [`POST /api/agents/speaking-quiz/jobs`](speaking-quiz-api-contract.md#21-kích-hoạt-job-sinh-câu-hỏi-speaking-quiz)
- **Governing Business Rule:** [`BR-09`](../../global/business-rules.md#br-09)

```gherkin
Scenario: Reject job request when neither storybookId nor customTopic is provided
  Given a payload without "storybookId" and without "customTopic"
  When the client sends "POST /api/agents/speaking-quiz/jobs"
  Then the response status is 400 Bad Request
    And no job is enqueued in Redis BullMQ
```

```gherkin
Scenario: Handle worker failure gracefully over SSE
  Given an enqueued speaking quiz job that fails inside the LangGraph pipeline
  When the worker encounters an unrecoverable exception
  Then the SSE stream emits an event with "status: failed" and an informative "message"
  And the client closes the SSE connection and renders a friendly retry UI
```

---

### AC-VOCAB-11: Speaking Hub Discovery & Dynamic Deep-Linking
- **Target User Story:** [`US-VOCAB-03`](spec.md#us-vocab-03)
- **Target Route:** `/vocab/speak-your-mind` (Hub), `/vocab/speak-your-mind/[id]` (Player)
- **Governing Business Rule:** [`BR-08`](../../global/business-rules.md#br-08)

```gherkin
Scenario: Navigate to Speaking Hub from bottom navigation bar
  Given the learner is anywhere in the mobile application
  When the learner taps the "Speak" tab in the bottom bar
  Then the browser navigates to "/vocab/speak-your-mind"
    And the page displays the "Speak Your Mind" header with PREP methodology explanation
    And the page displays the Daily Featured Challenge card
    And the page displays the AI Debate Generator action button
    And the page displays a filterable list of available challenge cards (B1, B2, C1)

Scenario: Open speaking challenge detail from Hub
  Given the learner is on "/vocab/speak-your-mind"
  When the learner taps "Luyện ngay" or clicks a challenge card with ID "sq-01"
  Then the browser navigates to "/vocab/speak-your-mind/sq-01"
    And the SpeakYourMindPlayer renders the dilemma, target keywords, and 4 PREP cards
    And a top bar with "← Quay lại danh sách" is visible

Scenario: Navigate back to Hub from Player
  Given the learner is inside "/vocab/speak-your-mind/sq-01"
  When the learner taps "← Quay lại danh sách"
  Then the browser navigates back to "/vocab/speak-your-mind" without state corruption
```

---

### AC-VOCAB-12: Visual Storybook Selection without Technical ID Exposure
- **Target User Story:** [`US-VOCAB-04`](spec.md#us-vocab-04)
- **Target Component:** `SpeakingQuizGenerator` & `StorybookSelectorModal`
- **Target API:** `GET /api/story-shadowing`

```gherkin
Scenario: Select Storybook visually from modal without typing ID
  Given the learner opens the AI Debate Generator and selects "Theo Storybook" tab
  When the learner taps "Chọn bài học từ Storybook"
  Then a modal dialog opens displaying recent storybooks fetched from "GET /api/story-shadowing"
    And each story card displays its title, thumbnail (or placeholder icon), and level badge
    And a search bar allows filtering storybooks by keyword

Scenario: Confirm storybook selection and bind internal ID
  Given the storybook selector modal is open
  When the learner clicks on a story titled "Atomic Habits Summary" with _id "679c1a2b3c4d5e6f7a8b9c0d"
  Then the modal closes
    And the form displays a selected story preview card showing title and level
    And the internal form payload binds "storybookId" to "679c1a2b3c4d5e6f7a8b9c0d"
    And the raw ID string is completely concealed from learner view
    And buttons to "Đổi bài khác" and "Xoá lựa chọn" are available
```

---

*Made by Anh Tu - Share to be share*
