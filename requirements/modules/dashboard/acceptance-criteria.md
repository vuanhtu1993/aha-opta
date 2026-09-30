# Module DASHBOARD — Acceptance Criteria (Gherkin & Boundary Rules)

> **Parent Document:** [Module Spec](spec.md) | [Requirement Analysis Package](../../README.md)  
> **Module ID:** `DASH` | **Target Audience:** Product Owner, Developer, QA Automation  
> **Linked Documents:** [API Contract](api-contract.md)

---

## 1. Purpose & Boundary Derivation

Acceptance Criteria define the exact boundary conditions governing the **PWA Application Shell**, **Due Review Notification Badges**, and **Micro-App Switching Behavior**.

---

## 2. Acceptance Scenarios (Gherkin)

### AC-DASH-01: Overdue Review Banner Display
- **Target User Story:** [`US-DASH-01`](spec.md#us-dash-01)
- **Target Component:** `DueReviewCard`
- **Target API:** [`GET /api/vocab/due-count`](api-contract.md#11-consumed-api-endpoints)

```gherkin
Scenario: Highlight overdue flashcards on the home screen
  Given "/api/vocab/due-count" returns dueCount = 8
  When the learner loads the home page "/"
  Then the "DueReviewCard" component renders with an amber highlight badge
    And the text states "8 cards due for review"
    And clicking "Review Now" navigates directly to "/vocab/review"
```

```gherkin
Scenario: Display caught-up state when no cards are due
  Given "/api/vocab/due-count" returns dueCount = 0
  When the learner loads the home page "/"
  Then the "DueReviewCard" component renders a green checkmark
    And the text indicates "You are all caught up for today!"
```

---

### AC-DASH-02: Continue Learning Card Hydration
- **Target User Story:** [`US-DASH-01`](spec.md#us-dash-01)
- **Target Component:** `ContinueLearning`
- **Target API:** [`GET /api/story-shadowing`](api-contract.md#11-consumed-api-endpoints)

```gherkin
Scenario: Render latest storybook resume card
  Given the system contains at least 1 storybook
  When the home page fetches the storybook list
  Then the "ContinueLearning" card displays the title of the first storybook in the list
    And clicking "Resume" navigates directly to "/apps/story-shadowing/player/[id]"
```

---

### AC-DASH-03: Fullscreen Tab Bar Suppression
- **Target User Story:** [`US-DASH-02`](spec.md#us-dash-02)
- **Target Component:** `MobileTabBar`

```gherkin
Scenario: Automatically hide bottom navigation on full-screen player pages
  Given the user is on the home page "/" where "MobileTabBar" is visible
  When the user navigates to "/apps/story-shadowing/player/65b90f4e"
  Then the "MobileTabBar" component unmounts and renders null
    And full screen height is dedicated to the shadowing player controls
```

---

### AC-DASH-04: Dynamic Badge on Vocab Tab
- **Target User Story:** [`US-DASH-02`](spec.md#us-dash-02)
- **Target Component:** `MobileTabBar`

```gherkin
Scenario: Display overdue number badge on the Vocab navigation tab
  Given "/api/vocab/due-count" returns dueCount = 14
  When the bottom navigation bar is rendered
  Then a red pill badge with text "14" is displayed on top of the Vocab icon
    And navigating between non-player tabs keeps the badge synchronized
```

---

*Made by Anh Tu - Share to be share*
