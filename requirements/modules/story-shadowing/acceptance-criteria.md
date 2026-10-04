# Module STORY-SHADOWING — Acceptance Criteria (Gherkin & Boundary Rules)

> **Parent Document:** [Module Spec](spec.md) | [Requirement Analysis Package](../../README.md)  
> **Module ID:** `SHADOW` | **Target Audience:** Product Owner, Developer, QA Automation  
> **Linked Documents:** [API Contract](api-contract.md) | [Agent API Contract v2.0](aha-mind-agents-api-contract.md)  
> **Version:** 2.0.0 (Asynchronous BullMQ + Redis Pub/Sub + GET SSE)

---

## 1. Purpose & Boundary Derivation

Acceptance Criteria define the exact boundary conditions governing the **Story Shadowing Engine**, **Agent Gateway Integration**, and **Audio-Sentence Synchronization**, directly enforcing [`BR-06`](../../global/business-rules.md#br-06).

---

## 2. Acceptance Scenarios (Gherkin)

### AC-SHADOW-01: Library Listing & Metadata
- **Target User Story:** [`US-SHADOW-01`](spec.md#us-shadow-01)
- **Target API:** [`GET /api/agents/story-shadowing/stories`](aha-mind-agents-api-contract.md#24-truy-vấn-danh-sách-bài-học-flexible-filters)

```gherkin
Scenario: Retrieve all active storybooks
  Given the database contains active storybooks
  When the user accesses the story shadowing catalog
  Then the response status is 200 OK
    And the returned object contains "total" and "stories" array
    And each story summary includes "_id", "title", "level", "sourceType", and "sentenceCount"
```

---

### AC-SHADOW-02: Precise Sentence Audio Playback & Word Highlighting
- **Target User Story:** [`US-SHADOW-01`](spec.md#us-shadow-01)
- **Target API:** [`GET /api/agents/story-shadowing/stories/:id`](aha-mind-agents-api-contract.md#23-lấy-dữ-liệu-chi-tiết-bài-học-storybook-theo-id)
- **Governing Business Rule:** [`BR-06`](../../global/business-rules.md#br-06)

```gherkin
Scenario: Play individual sentence with synchronized timestamps
  Given a storybook with YouTube video ID "dQw4w9WgXcQ"
    And sentence 1 has startMs = 5000 and endMs = 9500
  When the learner triggers playback for sentence 1
  Then the audio player seeks precisely to 5.0 seconds
    And playback automatically loops or pauses at 9.5 seconds
    And each word in sentence 1 displays an IPA phonetic label
```

---

### AC-SHADOW-03: Asynchronous Job Enqueueing & GET SSE Stream
- **Target User Story:** [`US-SHADOW-02`](spec.md#us-shadow-02)
- **Target API:** [`POST /api/agents/story-shadowing/jobs`](aha-mind-agents-api-contract.md#21-kích-hoạt-job-tạo-bài-học-shadowing-asynchronous-job-enqueue), [`GET /api/agents/story-shadowing/jobs/:jobId/progress`](aha-mind-agents-api-contract.md#22-lắng-nghe-tiến-trình-thời-gian-thực-qua-server-sent-events-get-sse)

```gherkin
Scenario: Successfully enqueue job and stream progress via SSE
  Given a valid English text between 10 and 10,000 characters
  When the user submits the creation form with pipeline "text"
  Then the API returns HTTP 202 Accepted
    And the response body contains "jobId", status "queued", and a valid "sseUrl"
  When the client connects to "sseUrl" via EventSource
  Then consecutive events are received for steps: "sentenceSplitter", "keywordIdentifier", "ttsGenerator", "keywordEnricher"
    And each event contains integer "progress" between 0 and 100
    And the terminal event has status "done" with a valid "storyId" in payload
```

---

### AC-SHADOW-04: Graceful Handling of Videos Without Captions
- **Target User Story:** [`US-SHADOW-02`](spec.md#us-shadow-02)
- **Target API:** [`POST /api/agents/story-shadowing/jobs`](aha-mind-agents-api-contract.md#21-kích-hoạt-job-tạo-bài-học-shadowing-asynchronous-job-enqueue)

```gherkin
Scenario: Reject YouTube video lacking transcripts
  Given a YouTube video URL that has disabled or non-existent English closed captions
  When the user submits a job request with pipeline "youtube"
  Then the SSE stream emits status "failed" or the API returns HTTP 422 Unprocessable Entity
    And the error payload explains that no accessible transcripts were detected
    And no corrupted records are inserted into the database
```

---

### AC-SHADOW-05: Deletion of Storybook Entry
- **Target Requirement:** [`FR-SHADOW-05`](spec.md#2-functional-requirements)
- **Target API:** [`DELETE /api/story-shadowing/:id`](api-contract.md#15-delete-apistory-shadowingid)

```gherkin
Scenario: Delete existing storybook
  Given a storybook with ID "679c1a2b3c4d5e6f7a8b9c0d" exists in the database
  When a curator sends a DELETE request to "/api/story-shadowing/679c1a2b3c4d5e6f7a8b9c0d"
  Then the API returns HTTP 200 OK
    And the document is removed from "storybooks"
    And static cache for "/apps/story-shadowing" is invalidated
```

---

### AC-SHADOW-06: Idempotent Fast-Path Retrieval (<50ms)
- **Target User Story:** [`US-SHADOW-03`](spec.md#us-shadow-03)
- **Target API:** [`POST /api/agents/story-shadowing/jobs`](aha-mind-agents-api-contract.md#21-kích-hoạt-job-tạo-bài-học-shadowing-asynchronous-job-enqueue)

```gherkin
Scenario: Immediate return for previously processed YouTube video
  Given a YouTube video "https://www.youtube.com/watch?v=dQw4w9WgXcQ" already exists in the database
  When a learner submits this URL with forceRegenerate = false
  Then the API returns HTTP 202 Accepted in under 50ms
    And status is "completed"
    And "existingStoryId" contains the ID of the existing storybook
    And the client redirects immediately to the player without opening an SSE connection
```

---

### AC-SHADOW-07: Route Cache Revalidation on Creation
- **Target Requirement:** [`FR-SHADOW-03`](spec.md#2-functional-requirements), [`FR-SHADOW-04`](spec.md#2-functional-requirements)

```gherkin
Scenario: Invalidate static cache after new storybook creation
  Given a learner completes generating a new storybook
  When the SSE emits status "done"
  Then the client executes Server Action "revalidateStoryShadowing()"
    And next visits to "/apps/story-shadowing" display the new storybook at the top of the list
```

---

### AC-SHADOW-08: Supadata Transcript Retrieval & Segment Suggestion
- **Target Requirement:** [`FR-SHADOW-07`](spec.md#2-functional-requirements)
- **Target API:** [`POST /api/story-shadowing/youtube/suggest-segments`](api-contract.md#13-post-apistory-shadowingyoutubesuggest-segments)

```gherkin
Scenario: Retrieve English transcript via Supadata residential proxy
  Given a valid YouTube URL and an active SUPADATA_API_KEY
  When the client calls POST /api/story-shadowing/youtube/suggest-segments
  Then the API returns HTTP 200 OK
    And if totalBlocks <= 200, needsSplitting is false
    And if totalBlocks > 200, needsSplitting is true with non-empty segments array

Scenario: Handle video with missing captions gracefully
  Given a YouTube video without any closed captions or subtitle tracks
  When the client calls POST /api/story-shadowing/youtube/suggest-segments
  Then the API returns HTTP 400 Bad Request
    And the error message clearly states "Video này không có phụ đề (Closed Captions)"
```

---

*Made by Anh Tu - Share to be share*

