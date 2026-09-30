# Module VOCAB — API Contract & Data Schemas

> **Parent Document:** [Module Spec](spec.md) | [Requirement Analysis Package](../../README.md)  
> **Module ID:** `VOCAB` | **Scope:** Vocabulary Management, SRS Scheduling & Audio APIs  
> **Linked Documents:** [Acceptance Criteria](acceptance-criteria.md)

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

*Made by Anh Tu - Share to be share*

