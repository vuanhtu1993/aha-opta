# Module STORY-SHADOWING — Acceptance Criteria (Gherkin & Boundary Rules)

> **Parent Document:** [Module Spec](spec.md) | [Requirement Analysis Package](../../README.md)  
> **Module ID:** `SHADOW` | **Target Audience:** Product Owner, Developer, QA Automation  
> **Linked Documents:** [API Contract](api-contract.md)

---

## 1. Purpose & Boundary Derivation

Acceptance Criteria define the exact boundary conditions governing the **Story Shadowing Engine**, **LangGraph Pipeline**, and **Audio-Sentence Synchronization**, directly enforcing [`BR-06`](../../global/business-rules.md#br-06).

---

## 2. Acceptance Scenarios (Gherkin)

### AC-SHADOW-01: Library Listing & Metadata
- **Target User Story:** [`US-SHADOW-01`](spec.md#us-shadow-01)
- **Target API:** [`GET /api/story-shadowing`](api-contract.md#11-get-apistory-shadowing)

```gherkin
Scenario: Retrieve all active storybooks
  Given the database contains 3 storybooks
  When the user accesses the story shadowing catalog
  Then the response status is 200 OK
    And the returned array contains 3 storybook summaries
    And each summary includes "title", "level", "sourceType", and "sentenceCount"
```

---

### AC-SHADOW-02: Precise Sentence Audio Playback
- **Target User Story:** [`US-SHADOW-01`](spec.md#us-shadow-01)
- **Target API:** [`GET /api/story-shadowing/:id`](api-contract.md#12-get-apistory-shadowingid)
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

### AC-SHADOW-03: LangGraph Pipeline Execution & SSE Progress
- **Target User Story:** [`US-SHADOW-02`](spec.md#us-shadow-02)
- **Target API:** [`POST /api/story-shadowing/youtube/create-series`](api-contract.md#14-post-apistory-shadowingyoutubecreate-series)

```gherkin
Scenario: Successfully process YouTube video into shadowing series
  Given a valid YouTube URL with public English captions
  When the curator submits the URL to create a series
  Then the HTTP response header "Content-Type" is "text/event-stream"
    And the client receives consecutive SSE chunks for steps: "split", "tts", "identify", "enrich"
    And upon pipeline completion, a new document is inserted in "storybooks" with non-empty sentences and keywords
```

---

### AC-SHADOW-04: Graceful Handling of Videos Without Captions
- **Target User Story:** [`US-SHADOW-02`](spec.md#us-shadow-02)
- **Target API:** [`POST /api/story-shadowing/youtube/suggest-segments`](api-contract.md#13-post-apistory-shadowingyoutubesuggest-segments)

```gherkin
Scenario: Reject YouTube video lacking transcripts
  Given a YouTube video ID that has disabled or non-existent subtitles
  When the curator requests segment suggestions
  Then the system responds with HTTP 422 Unprocessable Entity
    And the error payload explains that no accessible transcripts were detected
    And no orphaned records are saved to the database
```

---

*Made by Anh Tu - Share to be share*
