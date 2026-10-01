# Module VOCAB — API Contract & Data Schemas

> **Parent Document:** [Module Spec](spec.md) | [Requirement Analysis Package](../../README.md)  
> **Module ID:** `VOCAB` | **Scope:** Vocabulary Management, SRS Scheduling, Audio APIs & Speaking Quiz Agent Integration  
> **Linked Documents:** [Acceptance Criteria](acceptance-criteria.md) | [Speaking Quiz Agent Contract](speaking-quiz-api-contract.md)

---

## 1. Endpoints Specification

### 1.1 `GET /api/vocab/due-count`
- **Mapped Requirement:** [`FR-VOCAB-01`](spec.md#2-functional-requirements)
- **Governing Business Rules:** [`BR-01`](../../global/business-rules.md#br-01)
* **Purpose:** Returns the number of cards currently due for spaced repetition review.
* **Authentication:** None (Single-user mode).
* **Response (HTTP 200 OK):**
  ```json
  {
    "dueCount": 12,
    "totalCount": 85
  }
  ```

---

### 1.2 `GET /api/vocab/review-session`
- **Mapped Requirement:** [`FR-VOCAB-02`](spec.md#2-functional-requirements)
- **Mapped User Story:** [`US-VOCAB-01`](spec.md#us-vocab-01)
- **Governing Business Rules:** [`BR-02`](../../global/business-rules.md#br-02), [`BR-03`](../../global/business-rules.md#br-03)
* **Purpose:** Generates a randomized batch of quiz questions with dynamically assembled distractors and mode selection.
* **Query Parameters:**
  * `limit` (integer, optional, default: 15, max: 30)
  * `practiceAll` (boolean, optional, default: false)
* **Response (HTTP 200 OK):**
  ```json
  {
    "questions": [
      {
        "cardId": "65b8e92a1f2e1a001c9d8a11",
        "word": "ubiquitous",
        "ipa": "/juːˈbɪk.wə.təs/",
        "audioUrl": "/api/vocab/audio?word=ubiquitous",
        "level": "C1",
        "explanation": "Có mặt ở khắp mọi nơi, rất phổ biến",
        "quizMode": "cloze",
        "exampleSentences": [
          {
            "sentence": "Smartphones have become __________ in modern daily life.",
            "answer": "ubiquitous"
          }
        ],
        "options": [
          { "id": "A", "text": "Có mặt ở khắp mọi nơi, rất phổ biến", "isCorrect": true },
          { "id": "B", "text": "Tạm thời, không kéo dài", "isCorrect": false },
          { "id": "C", "text": "Rõ ràng, không thể chối cãi", "isCorrect": false },
          { "id": "D", "text": "Nguy hiểm, tiềm ẩn rủi ro", "isCorrect": false }
        ],
        "fsrsState": {
          "due": "2026-09-30T08:00:00.000Z",
          "reps": 3,
          "stability": 2.45
        }
      }
    ],
    "totalDue": 12,
    "sessionLimit": 15,
    "totalSaved": 85
  }
  ```

---

### 1.3 `POST /api/vocab/review`
- **Mapped Requirement:** [`FR-VOCAB-03`](spec.md#2-functional-requirements)
- **Mapped User Story:** [`US-VOCAB-01`](spec.md#us-vocab-01)
- **Governing Business Rules:** [`BR-01`](../../global/business-rules.md#br-01)
* **Purpose:** Submits the learner's recall rating, executes FSRS interval calculation, and logs the review event.
* **Request Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "cardId": "65b8e92a1f2e1a001c9d8a11",
    "rating": 3,
    "isCorrect": true,
    "responseTimeMs": 4200
  }
  ```
  *(Rating enum: `1: Again`, `2: Hard`, `3: Good`, `4: Easy`)*
* **Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "nextDue": "2026-10-04T12:30:00.000Z",
    "stability": 4.12,
    "difficulty": 5.2
  }
  ```
* **Failure Responses:**
  * `HTTP 400 Bad Request`: `{ "error": "Invalid rating or missing cardId" }`
  * `HTTP 404 Not Found`: `{ "error": "Vocab card not found" }`

---

### 1.4 `POST /api/vocab/generate-cloze-batch`
- **Mapped Requirement:** [`FR-VOCAB-04`](spec.md#2-functional-requirements)
- **Mapped User Story:** [`US-VOCAB-02`](spec.md#us-vocab-02)
* **Purpose:** Queries cards without example sentences and invokes Gemini 2.5 Flash to generate fill-in-the-blank sentences.
* **Request Body:**
  ```json
  {
    "limit": 10
  }
  ```
* **Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "processedCount": 10,
    "updatedWords": ["ubiquitous", "pragmatic", "resilience"]
  }
  ```

---

### 1.5 `GET /api/vocab/audio`
- **Mapped Requirement:** [`FR-VOCAB-05`](spec.md#2-functional-requirements)
* **Purpose:** Streams MP3 pronunciation audio synthesized via Google Cloud Text-to-Speech API.
* **Query Parameters:** `word` (string, required)
* **Response:** Binary audio stream (`Content-Type: audio/mpeg`).

---

### 1.6 `GET /api/vocab/speak-your-mind`
- **Mapped Requirement:** [`FR-VOCAB-06`](spec.md#2-functional-requirements)
- **Mapped User Story:** [`US-VOCAB-03`](spec.md#us-vocab-03)
- **Governing Business Rules:** [`BR-08`](../../global/business-rules.md#br-08)
* **Purpose:** Fetches a structured PREP speaking challenge question with scaffolded signposts, hints, and model answer.
* **Query Parameters:**
  * `id` (string, optional: specific question ID or random if omitted)
* **Response (HTTP 200 OK):**
  ```json
  {
    "id": "sq-01",
    "topic": "Technology & Education",
    "question": "Should AI be allowed to replace human teachers?",
    "level": "B2",
    "targetKeywords": [
      { "word": "empathy", "ipa": "/ˈem.pə.θi/", "meaning": "Sự thấu cảm, khả năng hiểu cảm xúc người khác" },
      { "word": "irreplaceable", "ipa": "/ˌɪr.ɪˈpleɪ.sə.bəl/", "meaning": "Không thể thay thế được" }
    ],
    "prepScaffold": {
      "point": {
        "signposts": ["In my opinion, ...", "I strongly believe that ...", "From my perspective, ..."],
        "hint": "Nêu rõ quan điểm của bạn: đồng ý hay phản đối việc AI thay thế giáo viên.",
        "modelAnswer": "In my opinion, AI can assist but should never fully replace human teachers."
      },
      "reason": {
        "signposts": ["The main reason is that ...", "Because ...", "Since ..."],
        "hint": "Chỉ ra lý do cốt lõi: giáo dục cần sự thấu cảm và kết nối cảm xúc giữa người với người.",
        "modelAnswer": "The primary reason is that genuine education requires empathy and emotional bonding, which algorithms completely lack."
      },
      "example": {
        "signposts": ["For instance, ...", "In my personal experience, ...", "Take ... as an example"],
        "hint": "Đưa ra ví dụ thực tế: lúc học sinh gặp khó khăn tâm lý, sự động viên của thầy cô tạo động lực thế nào.",
        "modelAnswer": "For instance, when students struggle with self-doubt or personal challenges, an empathetic teacher provides inspiration that no automated chatbot can offer."
      },
      "conclusion": {
        "signposts": ["Therefore, ...", "That is why ...", "To sum up, ..."],
        "hint": "Chốt lại luận điểm: AI là trợ thủ đắc lực, nhưng con người là không thể thay thế.",
        "modelAnswer": "Therefore, while AI is an extraordinary instructional assistant, the human essence of teaching remains truly irreplaceable."
      }
    }
  }
  ```

---

### 1.7 `POST /api/agents/speaking-quiz/jobs`
- **Mapped Requirement:** [`FR-VOCAB-07`](spec.md#2-functional-requirements)
- **Mapped User Story:** [`US-VOCAB-04`](spec.md#us-vocab-04)
- **Governing Business Rules:** [`BR-08`](../../global/business-rules.md#br-08), [`BR-09`](../../global/business-rules.md#br-09)
- **Full Contract:** [`speaking-quiz-api-contract.md#21`](speaking-quiz-api-contract.md#21-kích-hoạt-job-sinh-câu-hỏi-speaking-quiz)
* **Purpose:** Triggers asynchronous generation of a debate-oriented speaking challenge with a 4-stage PREP scaffold. Employs BullMQ for background queuing and Redis idempotency check.
* **Request Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "storybookId": "679c1a2b3c4d5e6f7a8b9c0d",
    "customTopic": "Work from Home vs Office Work",
    "level": "B2",
    "targetKeywords": ["sustainable", "transition"],
    "forceRegenerate": false
  }
  ```
  *(Rule: Either `storybookId` or `customTopic` must be provided; `level` must be `"B1" | "B2" | "C1"`)*
* **Responses (HTTP 202 Accepted):**
  - **Cold Job Queued:**
    ```json
    {
      "jobId": "4",
      "status": "queued",
      "sseUrl": "/api/agents/speaking-quiz/jobs/4/progress",
      "createdAt": "2026-10-01T09:30:00.000Z"
    }
    ```
  - **Idempotent Cache Hit (`< 50ms`):**
    ```json
    {
      "jobId": "existing-6abdc5cae5d0b4f316e5516c",
      "status": "completed",
      "existingQuestionId": "6abdc5cae5d0b4f316e5516c",
      "createdAt": "2026-10-01T08:15:30.000Z"
    }
    ```

---

### 1.8 `GET /api/agents/speaking-quiz/jobs/:jobId/progress`
- **Mapped Requirement:** [`FR-VOCAB-07`](spec.md#2-functional-requirements)
- **Mapped User Story:** [`US-VOCAB-04`](spec.md#us-vocab-04)
- **Governing Business Rules:** [`BR-09`](../../global/business-rules.md#br-09)
- **Full Contract:** [`speaking-quiz-api-contract.md#22`](speaking-quiz-api-contract.md#22-lắng-nghe-tiến-trình-thời-gian-thực-qua-sse)
* **Purpose:** Server-Sent Events (SSE) stream emitting real-time stage progress across the LangGraph multi-agent pipeline.
* **Headers:** `Accept: text/event-stream`
* **Response Content-Type:** `text/event-stream`
* **Event Progression:**
  - `context_resolved` (25%): Context resolved from Storybook or Custom Topic.
  - `question_formulated` (50%): Debate question formulated.
  - `prep_synthesized` (80%): 4-stage PREP scaffold & model answer synthesized.
  - `completed` / `done` (100%): MongoDB document saved; payload contains `questionId` and token usage metrics. Client terminates SSE connection upon receiving `status === "done"`.

---

### 1.9 `GET /api/agents/speaking-quiz/questions/:id` & `GET /api/agents/speaking-quiz/questions`
- **Mapped Requirement:** [`FR-VOCAB-06`](spec.md#2-functional-requirements), [`FR-VOCAB-07`](spec.md#2-functional-requirements)
- **Full Contract:** [`speaking-quiz-api-contract.md#23`](speaking-quiz-api-contract.md#23-truy-vấn-danh-sách-câu-hỏi-flexible-filters), [`speaking-quiz-api-contract.md#24`](speaking-quiz-api-contract.md#24-lấy-chi-tiết-một-câu-hỏi-theo-id)
* **Purpose:** Retrieves a single speaking question by ID or queries questions filtered by `storybookId` and `level`.
* **Response (HTTP 200 OK):** Fully assembled `SpeakingQuestionDetail` with `prepScaffold` (Point, Reason, Example, Conclusion).

---

## 2. Client Integration Types (TypeScript)

See full TypeScript definitions and client integration SDK in [`speaking-quiz-api-contract.md#3`](speaking-quiz-api-contract.md#3-typescript-interfaces-dành-cho-client-aha-tools) and [`speaking-quiz-api-contract.md#4`](speaking-quiz-api-contract.md#4-code-mẫu-tích-hợp-sdk-integration-example).

---

*Made by Anh Tu - Share to be share*

