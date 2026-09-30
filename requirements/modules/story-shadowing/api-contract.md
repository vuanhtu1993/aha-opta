# Module STORY-SHADOWING — API Contract & Data Schemas

> **Parent Document:** [Module Spec](spec.md) | [Requirement Analysis Package](../../README.md)  
> **Module ID:** `SHADOW` | **Scope:** Storybook Management, YouTube Pipelines & Speech Endpoints  
> **Linked Documents:** [Acceptance Criteria](acceptance-criteria.md)

---

## 1. Endpoints Specification

### 1.1 `GET /api/story-shadowing`
- **Mapped Requirement:** [`FR-SHADOW-01`](spec.md#2-functional-requirements)
- **Governing Business Rules:** [`BR-06`](../../global/business-rules.md#br-06)
* **Purpose:** Returns the library of all available storybooks with high-level metadata.
* **Response (HTTP 200 OK):**
  ```json
  [
    {
      "_id": "65b90f4e3c2b1a002b8d9c12",
      "title": "The Psychology of Habits",
      "level": "medium",
      "sourceType": "youtube",
      "youtubeVideoId": "dQw4w9WgXcQ",
      "sentenceCount": 24,
      "seriesId": "habits-mastery-series",
      "partIndex": 1,
      "totalParts": 3,
      "createdAt": "2026-09-28T10:00:00.000Z"
    }
  ]
  ```

---

### 1.2 `GET /api/story-shadowing/:id`
- **Mapped Requirement:** [`FR-SHADOW-02`](spec.md#2-functional-requirements)
- **Mapped User Story:** [`US-SHADOW-01`](spec.md#us-shadow-01)
* **Purpose:** Fetches the full interactive player payload for a specific storybook.
* **Response (HTTP 200 OK):**
  ```json
  {
    "_id": "65b90f4e3c2b1a002b8d9c12",
    "title": "The Psychology of Habits",
    "level": "medium",
    "sourceType": "youtube",
    "youtubeVideoId": "dQw4w9WgXcQ",
    "voice": "en-US-Journey-F",
    "speakingRate": 1.0,
    "sentences": [
      {
        "id": 1,
        "text": "Habits are the compound interest of self-improvement.",
        "startMs": 12500,
        "endMs": 16200,
        "words": [
          { "word": "Habits", "ipa": "/ˈhæb.ɪts/" },
          { "word": "compound", "ipa": "/ˈkɒm.paʊnd/" },
          { "word": "interest", "ipa": "/ˈɪn.trəst/" }
        ]
      }
    ],
    "keywords": [
      {
        "word": "compound interest",
        "explanation": "Lãi kép; sự tích lũy tăng trưởng theo cấp số nhân",
        "level": "B2",
        "collocations": [
          { "collocation": "earn compound interest", "explanation": "Hưởng lãi kép" }
        ]
      }
    ]
  }
  ```

---

### 1.3 `POST /api/story-shadowing/youtube/suggest-segments`
- **Mapped Requirement:** [`FR-SHADOW-03`](spec.md#2-functional-requirements)
* **Purpose:** Inspects YouTube transcript and recommends natural chapter/part breaks.
* **Request Body:**
  ```json
  {
    "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "targetPartDurationMinutes": 3
  }
  ```
* **Response (HTTP 200 OK):**
  ```json
  {
    "videoId": "dQw4w9WgXcQ",
    "videoTitle": "Atomic Habits Summary",
    "suggestedParts": [
      {
        "partIndex": 1,
        "title": "Part 1: The Power of Tiny Gains",
        "startSeconds": 0,
        "endSeconds": 185
      }
    ]
  }
  ```

---

### 1.4 `POST /api/story-shadowing/youtube/create-series`
- **Mapped Requirement:** [`FR-SHADOW-04`](spec.md#2-functional-requirements)
- **Mapped User Story:** [`US-SHADOW-02`](spec.md#us-shadow-02)
- **Governing Business Rules:** [`BR-06`](../../global/business-rules.md#br-06)
* **Purpose:** Initiates the multi-agent LangGraph pipeline, executing sentence splitting, IPA generation, TTS synthesis, and keyword extraction while streaming live SSE progress.
* **Request Headers:** `Content-Type: application/json`
* **Response Headers:** `Content-Type: text/event-stream`, `Cache-Control: no-cache`
* **SSE Event Chunks:**
  ```text
  data: {"type":"init","title":"Processing Video...","steps":[{"id":"split","name":"Split & IPA"}]}

  data: {"type":"update","stepId":"split","status":"running"}

  data: {"type":"update","stepId":"split","status":"completed"}

  data: {"type":"done","storybookId":"65b90f4e3c2b1a002b8d9c12"}
  ```

---

### 1.5 `DELETE /api/story-shadowing/:id`
- **Mapped Requirement:** [`FR-SHADOW-05`](spec.md#2-functional-requirements)
* **Purpose:** Permanently deletes a storybook by ObjectId.
* **Response (HTTP 200 OK):**
  ```json
  { "success": true, "deletedId": "65b90f4e3c2b1a002b8d9c12" }
  ```

---

*Made by Anh Tu - Share to be share*
