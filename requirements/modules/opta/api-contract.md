# Module OPTA — API Contract & Data Schemas

> **Parent Document:** [Module Spec](spec.md) | [Requirement Analysis Package](../../README.md)  
> **Module ID:** `OPTA` | **Scope:** Football Analytics, Fixtures, Elo Scraping & Prediction APIs  
> **Linked Documents:** [Acceptance Criteria](acceptance-criteria.md)

---

## 1. Endpoints Specification

### 1.1 `GET /api/opta/matches`
- **Mapped Requirement:** [`FR-OPTA-01`](spec.md#2-functional-requirements)
- **Governing Business Rules:** [`BR-04`](../../global/business-rules.md#br-04)
* **Purpose:** Queries football matches with optional filtering by status or tournament stage.
* **Query Parameters:**
  * `status` (string, optional: `scheduled`, `live`, `finished`)
  * `stage` (string, optional: `Group Stage`, `Round of 16`, etc.)
* **Response (HTTP 200 OK):**
  ```json
  [
    {
      "_id": "65b92e1f4d3a2b003c9e1f22",
      "apiFootballId": 1184201,
      "homeTeam": {
        "_id": "65b92d001",
        "name": "France",
        "flag": "https://flags.fm/fr.svg",
        "eloRating": 2045
      },
      "awayTeam": {
        "_id": "65b92d002",
        "name": "Senegal",
        "flag": "https://flags.fm/sn.svg",
        "eloRating": 1780
      },
      "status": "scheduled",
      "matchDate": "2026-06-15T19:00:00.000Z",
      "stage": "Group Stage",
      "group": "A",
      "venue": "MetLife Stadium, New Jersey",
      "latestPrediction": {
        "predictedWinner": "home",
        "probabilities": { "home": 62.5, "draw": 22.0, "away": 15.5 },
        "confidence": 0.78
      }
    }
  ]
  ```

---

### 1.2 `POST /api/opta/predict`
- **Mapped Requirement:** [`FR-OPTA-02`](spec.md#2-functional-requirements)
- **Mapped User Story:** [`US-OPTA-01`](spec.md#us-opta-01)
- **Governing Business Rules:** [`BR-04`](../../global/business-rules.md#br-04), [`BR-05`](../../global/business-rules.md#br-05)
* **Purpose:** Executes the 4-node LangGraph pipeline to generate a forecast for a scheduled match.
* **Request Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "matchId": "65b92e1f4d3a2b003c9e1f22"
  }
  ```
* **Response (HTTP 200 OK):**
  ```json
  {
    "prediction": {
      "matchId": "65b92e1f4d3a2b003c9e1f22",
      "modelVersion": "gemini-2.5-flash@opta-v1",
      "predictedWinner": "home",
      "predictedScore": "2-0",
      "probabilities": {
        "home": 62.5,
        "draw": 22.0,
        "away": 15.5
      },
      "confidence": 0.78,
      "reasoning": "France dominates historical Elo differential (+265) and recent xG creation (2.4 per match). Senegal maintains solid defensive structure but exhibits lower chance conversion away from home.",
      "keyFactors": [
        "Superior French midfield progression",
        "Senegal injury doubts in central defense",
        "Elo rating disparity"
      ],
      "contextSnapshot": {
        "homeFormIndex": 84,
        "awayFormIndex": 62,
        "expertOpinion": "Analysts overwhelmingly favor France following their dominant qualification run."
      }
    }
  }
  ```
* **Failure Responses:**
  * `HTTP 400 Bad Request`: `{ "error": "Missing matchId" }`
  * `HTTP 404 Not Found`: `{ "error": "Match or participating teams not found" }`

---

### 1.3 `POST /api/opta/scrape/elo`
- **Mapped Requirement:** [`FR-OPTA-03`](spec.md#2-functional-requirements)
- **Mapped User Story:** [`US-OPTA-02`](spec.md#us-opta-02)
* **Purpose:** Triggers web scraping of `eloratings.net` and persists updated Elo scores.
* **Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "updatedCount": 48,
    "scrapedAt": "2026-09-30T06:00:00.000Z"
  }
  ```

---

### 1.4 `POST /api/opta/sync`
- **Mapped Requirement:** [`FR-OPTA-04`](spec.md#2-functional-requirements)
- **Governing Business Rules:** [`BR-04`](../../global/business-rules.md#br-04)
* **Purpose:** Updates finished fixtures with verified official scores and marks predictions as correct/incorrect.
* **Request Body:**
  ```json
  {
    "matchId": "65b92e1f4d3a2b003c9e1f22",
    "homeScore": 2,
    "awayScore": 1,
    "status": "finished"
  }
  ```
* **Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "actualOutcome": "home",
    "predictionsEvaluated": 1,
    "accuracyRate": 1.0
  }
  ```

---

### 1.5 `GET /api/opta/teams`
- **Mapped Requirement:** [`FR-OPTA-05`](spec.md#2-functional-requirements)
* **Purpose:** Returns list of all participating teams with Elo ranking and group assignments.
* **Response (HTTP 200 OK):**
  ```json
  [
    {
      "_id": "65b92d001",
      "name": "Argentina",
      "group": "B",
      "confederation": "CONMEBOL",
      "fifaRanking": 1,
      "eloRating": 2130,
      "eloRank": 1
    }
  ]
  ```

---

*Made by Anh Tu - Share to be share*
