# Module FUN-FEED — Acceptance Criteria (Gherkin & Boundary Rules)

> **Parent Document:** [Module Spec](spec.md) | [Requirement Analysis Package](../../README.md)  
> **Module ID:** `FUNFEED` | **Target Audience:** Product Owner, Developer, QA Automation  
> **Linked Documents:** [API Contract (aha-mind-agents)](fun-feed-api-contract.md)  
> **Version:** 1.0.0 (Cursor Pagination + CDN Offload Architecture)

---

## 1. Purpose & Boundary Derivation

Acceptance Criteria define the exact boundary conditions governing the **Fun Feed Edutainment Engine**, **Media Card Rendering**, **Cursor Pagination**, and **User Interaction Tracking**, directly enforcing [`BR-10`](../../global/business-rules.md#br-10) (Fun Feed Content Moderation & CDN Offload).

---

## 2. Acceptance Scenarios (Gherkin)

### AC-FUNFEED-01: Cursor Pagination & Infinite Scroll
- **Target User Story:** [`US-FUNFEED-01`](spec.md#us-funfeed-01)
- **Target API:** [`GET /api/funny-feed`](fun-feed-api-contract.md#21-lấy-danh-sách-fun-feed-cursor-pagination-cho-tiktok-swipe)

```gherkin
Scenario: Initial feed load with default pagination
  Given the database contains at least 15 published media items
  When the user navigates to "/fun-feed" without any query params
  Then the FunFeedClient calls GET /api/funny-feed?limit=10
    And the response status is 200 OK
    And the response body contains "items" array with at most 10 elements
    And each item contains "_id", "source", "type", "title", "mediaUrl", "stats", "status", "publishedAt"
    And "nextCursor" is a valid ISO 8601 date string
    And "hasMore" is true

Scenario: Load next page using cursor
  Given the user has received nextCursor "2026-10-16T08:25:00.000Z" from the first page
  When the user scrolls to the last visible card (triggering infinite scroll)
  Then the FunFeedClient calls GET /api/funny-feed?cursor=2026-10-16T08:25:00.000Z&limit=10
    And the response contains items published strictly before the cursor timestamp
    And no items from the first page are duplicated

Scenario: Empty feed graceful handling
  Given the database contains 0 published media items
  When the user navigates to "/fun-feed"
  Then the response body contains "items" as an empty array
    And "nextCursor" is null
    And "hasMore" is false
    And the UI displays an empty state illustration with message "Chưa có nội dung mới"
```

---

### AC-FUNFEED-02: Topic & Level Filtering
- **Target User Story:** [`US-FUNFEED-02`](spec.md#us-funfeed-02)
- **Target API:** [`GET /api/funny-feed?topic=...&level=...`](fun-feed-api-contract.md#21-lấy-danh-sách-fun-feed-cursor-pagination-cho-tiktok-swipe)

```gherkin
Scenario: Filter by topic only
  Given the database contains items with topics "grammar", "vocabulary", "pronunciation"
  When the user selects topic filter chip "grammar"
  Then the FunFeedClient calls GET /api/funny-feed?topic=grammar&limit=10
    And all returned items have topic equal to "grammar"

Scenario: Filter by level only
  Given the database contains items with levels "beginner", "intermediate", "advanced"
  When the user selects level filter chip "beginner"
  Then the FunFeedClient calls GET /api/funny-feed?level=beginner&limit=10
    And all returned items have level equal to "beginner"

Scenario: Combined filter (topic + level)
  Given the database contains mixed items
  When the user selects topic "vocabulary" AND level "intermediate"
  Then the FunFeedClient calls GET /api/funny-feed?topic=vocabulary&level=intermediate&limit=10
    And all returned items match both topic="vocabulary" AND level="intermediate"

Scenario: Filter yields no results
  Given no published items match topic="pronunciation" AND level="advanced"
  When the user applies this filter combination
  Then the response returns an empty items array
    And "hasMore" is false
    And the UI displays "Không tìm thấy nội dung phù hợp" with a "Xóa bộ lọc" reset button
```

---

### AC-FUNFEED-03: Full-screen Media Rendering (GIF & YouTube)
- **Target User Story:** [`US-FUNFEED-01`](spec.md#us-funfeed-01)
- **Target Requirement:** [`FR-FUNFEED-03`](spec.md#2-functional-requirements)

```gherkin
Scenario: Render GIF media card
  Given a feed item with type "gif" and mediaUrl "https://media2.giphy.com/media/xxx/giphy.gif"
  When the card scrolls into the viewport (scroll-snap-align: start)
  Then an <img> element renders with src equal to mediaUrl
    And the image streams directly from GIPHY CDN (no proxy through aha-mind-agents)
    And the card occupies exactly 100vh height with object-fit: contain
    And the GIF auto-plays within 500ms of entering viewport

Scenario: Render YouTube Shorts media card
  Given a feed item with type "short_video" and source "youtube"
    And mediaUrl "https://www.youtube.com/embed/QOALbeDSToQ"
  When the card scrolls into the viewport
  Then an <iframe> element renders with src "{mediaUrl}?autoplay=1&mute=1&loop=1&controls=0"
    And the iframe has allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    And the iframe occupies 100vh with border: 0

Scenario: Scroll snap behavior between cards
  Given the feed container has CSS scroll-snap-type: y mandatory
  When the user performs a vertical swipe gesture
  Then the next card snaps precisely to the top of the viewport
    And the transition achieves 60 FPS without jank
```

---

### AC-FUNFEED-04: Learning Overlay (Glassmorphism Card)
- **Target User Story:** [`US-FUNFEED-01`](spec.md#us-funfeed-01)
- **Target Requirement:** [`FR-FUNFEED-04`](spec.md#2-functional-requirements)

```gherkin
Scenario: Display learning information overlay
  Given a feed item with topic "grammar", level "beginner"
    And whyFunny "Biểu cảm bất lực hài hước của giáo viên..."
    And youLearned "Phân biệt rõ cách dùng thì Past Simple..."
  When the media card is rendered on screen
  Then a semi-transparent glassmorphism overlay appears at the bottom half
    And the overlay displays a topic badge "[grammar]" and level badge "[beginner]"
    And the overlay shows "💡 {whyFunny}" text
    And the overlay shows "🎯 {youLearned}" text
    And the right column displays Like (with count), Save, and Report action buttons

Scenario: Overlay does not obscure media
  Given a media card with glassmorphism overlay
  When the overlay is rendered
  Then the overlay has backdrop-filter: blur and semi-transparent background
    And the media content behind the overlay remains partially visible
    And the overlay text meets WCAG AA contrast ratio (≥ 4.5:1)
```

---

### AC-FUNFEED-05: Like & Save Interactions with Optimistic UI
- **Target User Story:** [`US-FUNFEED-03`](spec.md#us-funfeed-03)
- **Target API:** [`POST /api/funny-feed/:id/interact`](fun-feed-api-contract.md#22-ghi-nhận-tương-tác-người-dùng-like--save--skip--report)

```gherkin
Scenario: Like a feed item (optimistic update)
  Given a feed item with _id "670e3f1a2b3c4d5e6f7a8b9c" displaying stats.likes = 56
  When the learner taps the ❤️ Like button
  Then the UI immediately increments the like count to 57 (optimistic)
    And a heart burst animation plays on the button
    And the FunFeedClient sends POST /api/funny-feed/670e3f1a2b3c4d5e6f7a8b9c/interact { action: "like" }
    And the server responds with 201 Created { success: true }

Scenario: Save a feed item
  Given a feed item visible on screen
  When the learner taps the 🔖 Save button
  Then the save icon toggles to a filled state (visual confirmation)
    And the FunFeedClient sends POST /api/funny-feed/:id/interact { action: "save" }
    And the server responds with 201 Created { success: true }

Scenario: Optimistic rollback on server failure
  Given the learner taps Like on a feed item
    And the FunFeedClient call fails (network error or 5xx)
  When the error is detected
  Then the like count reverts to the original value
    And a toast notification displays "Không thể ghi nhận tương tác. Vui lòng thử lại."
```

---

### AC-FUNFEED-06: Content Report & Auto-Hide Threshold
- **Target User Story:** [`US-FUNFEED-03`](spec.md#us-funfeed-03)
- **Target API:** [`POST /api/funny-feed/:id/interact`](fun-feed-api-contract.md#22-ghi-nhận-tương-tác-người-dùng-like--save--skip--report)
- **Governing Business Rule:** [`BR-10`](../../global/business-rules.md#br-10) (proposed)

```gherkin
Scenario: Report content with reason
  Given a feed item visible on screen
  When the learner taps the 🚩 Report button
  Then a modal dialog appears requesting a report reason (text input)
  When the learner enters "Nội dung không phù hợp cho học sinh" and submits
  Then the FunFeedClient sends POST /api/funny-feed/:id/interact
    With body { action: "report", reportReason: "Nội dung không phù hợp cho học sinh" }
    And the server responds with 201 Created { success: true }
    And the UI shows confirmation "Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét."

Scenario: Auto-hide content at report threshold
  Given a feed item currently has stats.reports = 2
  When a third distinct user reports the same item
  Then the backend automatically sets the item status to "hidden"
    And the item no longer appears in any subsequent GET /api/funny-feed responses
    And users who have already loaded this item see it gracefully removed on next refresh

Scenario: Report without reason is rejected
  Given the learner taps Report on a feed item
  When the learner submits the report modal without entering a reason
  Then the submit button remains disabled
    And a validation message displays "Vui lòng nhập lý do báo cáo"
```

---

### AC-FUNFEED-07: Skip Interaction (Passive Analytics)
- **Target Requirement:** [`FR-FUNFEED-05`](spec.md#2-functional-requirements)
- **Target API:** [`POST /api/funny-feed/:id/interact`](fun-feed-api-contract.md#22-ghi-nhận-tương-tác-người-dùng-like--save--skip--report)

```gherkin
Scenario: Record skip interaction on rapid swipe
  Given a feed item was visible for less than 2 seconds
  When the learner swipes to the next card
  Then the FunFeedClient sends POST /api/funny-feed/:id/interact { action: "skip" }
    And no UI feedback is shown to the user (silent analytics)
    And the interaction is stored for future recommendation analysis
```

---

### AC-FUNFEED-08: Guest User Support (No Authentication Required)
- **Target Requirement:** [`FR-FUNFEED-05`](spec.md#2-functional-requirements)

```gherkin
Scenario: Browse and interact without login
  Given a guest user (no x-user-id header)
  When the user browses the feed and taps Like
  Then the FunFeedClient sends the POST request without x-user-id header
    And the server still records the interaction and responds with 201 Created
    And all feed browsing and filtering works identically to logged-in users
```

---

*Made by Anh Tu - Share to be share*
