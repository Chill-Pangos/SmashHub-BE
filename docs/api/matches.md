# Matches

Match management endpoints

Total endpoints: 8

## GET /api/matches/pending
Tag: Matches
Summary: Get all pending matches awaiting chief referee approval

Retrieve list of matches with resultStatus = 'pending' that require chief referee approval.
These matches have been completed by referees and submitted for review but not yet approved.

Business Logic:
- Only returns matches where status = 'completed' AND resultStatus = 'pending'
- Chief referee can then approve or reject these results
- Approval updates standings/brackets and Elo scores
- Rejection resets match to 'in_progress' for referee resubmission

Auth: bearerAuth

Request parameters:
- tournamentId (query) | type: integer | required | Tournament ID used to verify chief referee permission
- page (query) | type: integer | Page number for pagination (1-indexed) | default: 1
- limit (query) | type: integer | Maximum number of records per page | default: 10

Request body:
None

Responses:
### 200
Description: Successfully retrieved pending matches with pagination
Type: object
Body:
  - matches: array
    - items: object
      - id: integer
      - scheduleId: integer
      - entryAId: integer
      - entryBId: integer
      - status: string | choices: scheduled, in_progress, completed, cancelled
      - winnerEntryId: integer
      - resultStatus: string | choices: pending, approved, rejected
      - reviewNotes: string
      - createdAt: string
      - updatedAt: string
  - count: integer
Example response:
```json
{
  "matches": [
    {
      "id": 42,
      "scheduleId": 15,
      "entryAId": 101,
      "entryBId": 102,
      "status": "completed",
      "winnerEntryId": 101,
      "resultStatus": "pending",
      "reviewNotes": null,
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z"
    }
  ],
  "count": 5
}
```

### 400
Description: Invalid request data
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

### 403
Description: Insufficient permissions
Type: object
Example response:
```json
{
  "message": "Forbidden - insufficient permissions"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## POST /api/matches/{id}/start
Tag: Matches
Summary: Start a match and assign referees dynamically

Transition match from 'scheduled' to 'in_progress' status.
Automatically assigns a table (if available) and dynamically assigns available referees from tournament pool.

Business Logic:
- Match must be in 'scheduled' status
- Assigns available table dynamically (rotates through assigned tables)
- Assigns 1-2 available referees from tournament referee pool (least busy first)
- Only assigned referees can finalize the match result
- Changes match status to 'in_progress'

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Match ID to start

Request body:
Required: no
Type: object

Responses:
### 200
Description: Match started successfully with referees and table assigned
Type: object
Body:
  - id: integer
  - scheduleId: integer
  - entryAId: integer
  - entryBId: integer
  - status: string | choices: scheduled, in_progress, completed, cancelled
  - winnerEntryId: integer
  - resultStatus: string | choices: pending, approved, rejected
  - createdAt: string
  - updatedAt: string
Example response:
```json
{
  "id": 42,
  "scheduleId": 15,
  "entryAId": 101,
  "entryBId": 102,
  "status": "in_progress",
  "winnerEntryId": null,
  "resultStatus": null,
  "createdAt": "2026-05-27T00:00:00Z",
  "updatedAt": "2026-05-27T00:00:00Z"
}
```

### 400
Description: Bad request - Match not in scheduled status or insufficient referees available
Type: object
Example response:
```json
{
  "message": "Cannot start match. Status is \"in_progress\", must be \"scheduled\""
}
```

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

### 403
Description: Insufficient permissions
Type: object
Example response:
```json
{
  "message": "Forbidden - insufficient permissions"
}
```

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## POST /api/matches/{id}/finalize
Tag: Matches
Summary: Submit match result for chief referee approval

Assigned referee submits the final match result. Match transitions to 'completed' with 'pending' resultStatus.
Result will be reviewed and approved/rejected by chief referee before affecting standings and Elo.

Business Logic:
- Match must be in 'in_progress' status
- Only assigned referees can finalize
- Validates that at least one team won enough sets: floor(maxSets/2) + 1
- Sets winner automatically based on sets won
- Changes match status to 'completed', resultStatus to 'pending'
- Chief referee must approve before standings/ELO are updated
- If rejected by chief referee, match returns to 'in_progress' for re-submission

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Match ID to finalize

Request body:
Required: no
Type: object

Responses:
### 200
Description: Match result submitted successfully, awaiting chief referee approval
Type: object
Body:
  - message: string
  - match: object
    - id: integer
    - scheduleId: integer
    - entryAId: integer
    - entryBId: integer
    - status: string | choices: scheduled, in_progress, completed, cancelled
    - winnerEntryId: integer
    - resultStatus: string | choices: pending, approved, rejected
    - reviewNotes: string
    - createdAt: string
    - updatedAt: string
Example response:
```json
{
  "message": "Match result submitted successfully. Waiting for chief referee approval.",
  "match": {
    "id": 42,
    "scheduleId": 15,
    "entryAId": 101,
    "entryBId": 102,
    "status": "completed",
    "winnerEntryId": 101,
    "resultStatus": "pending",
    "reviewNotes": null,
    "createdAt": "2026-05-27T00:00:00Z",
    "updatedAt": "2026-05-27T00:00:00Z"
  }
}
```

### 400
Description: Bad request - Match not in_progress status or not enough sets completed
Type: object
Example response:
```json
{
  "message": "Match not complete. Need 2 sets to win. Entry A: 1, Entry B: 1"
}
```

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

### 403
Description: Insufficient permissions
Type: object
Example response:
```json
{
  "message": "Forbidden - insufficient permissions"
}
```

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## POST /api/matches/{id}/approve
Tag: Matches
Summary: Approve match result (Chief Referee only)

Chief referee approves a pending match result. This triggers final updates to standings/brackets and Elo scores.

Business Logic:
- Match must be in 'completed' status with resultStatus = 'pending'
- Only chief referee of the tournament can approve
- Changes resultStatus to 'approved'
- For group stage: Updates group standings (win/loss counts, sets won/lost)
- For knockout stage: Advances winner to next round bracket
- Calculates and updates Elo scores for all participating players
- Approved results are permanent and affect tournament progression

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Match ID to approve

Request body:
Required: no
Type: object
Fields:
  - reviewNotes: string | Optional review notes from chief referee
Example payload:
```json
{
  "reviewNotes": "string"
}
```

Responses:
### 200
Description: Match result approved successfully, standings/brackets and Elo updated
Type: object
Body:
  - message: string
  - match: object
    - id: integer
    - scheduleId: integer
    - entryAId: integer
    - entryBId: integer
    - status: string | choices: scheduled, in_progress, completed, cancelled
    - winnerEntryId: integer
    - resultStatus: string | choices: pending, approved, rejected
    - reviewNotes: string
    - createdAt: string
    - updatedAt: string
Example response:
```json
{
  "message": "Match result approved successfully. Standings and Elo scores updated.",
  "match": {
    "id": 42,
    "scheduleId": 15,
    "entryAId": 101,
    "entryBId": 102,
    "status": "completed",
    "winnerEntryId": 101,
    "resultStatus": "approved",
    "reviewNotes": "Match approved. Set scores verified.",
    "createdAt": "2026-05-27T00:00:00Z",
    "updatedAt": "2026-05-27T00:00:00Z"
  }
}
```

### 400
Description: Bad request - Invalid match state (must be completed with pending result)
Type: object
Example response:
```json
{
  "message": "Cannot approve. Result status is \"approved\", must be \"pending\""
}
```

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

### 403
Description: Forbidden - User is not the chief referee of the tournament
Type: object
Example response:
```json
{
  "message": "Only the chief referee can perform this action"
}
```

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## POST /api/matches/{id}/reject
Tag: Matches
Summary: Reject match result (Chief Referee only)

Chief referee rejects a pending match result and sends it back for resubmission.

Business Logic:
- Match must be in 'completed' status with resultStatus = 'pending'
- Only chief referee of the tournament can reject
- Changes resultStatus to 'rejected'
- Resets match status to 'in_progress' so referee can resubmit
- Clears winner entry so referee must resubmit scores
- Review notes explaining rejection are recorded
- Referee must submit the match result again after rejection

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Match ID to reject

Request body:
Required: yes
Type: object
Fields:
  - reviewNotes: string | required | Required explanation for why the result was rejected
Example payload:
```json
{
  "reviewNotes": "string"
}
```

Responses:
### 200
Description: Match result rejected successfully, match returned to in_progress status
Type: object
Body:
  - message: string
  - match: object
    - id: integer
    - scheduleId: integer
    - entryAId: integer
    - entryBId: integer
    - status: string | choices: scheduled, in_progress, completed, cancelled
    - winnerEntryId: integer
    - resultStatus: string | choices: pending, approved, rejected
    - reviewNotes: string
    - createdAt: string
    - updatedAt: string
Example response:
```json
{
  "message": "Match result rejected. Referee needs to resubmit the result.",
  "match": {
    "id": 42,
    "scheduleId": 15,
    "entryAId": 101,
    "entryBId": 102,
    "status": "in_progress",
    "winnerEntryId": null,
    "resultStatus": "rejected",
    "reviewNotes": "Set scores don't match the recorded points. Please resubmit with correct scores.",
    "createdAt": "2026-05-27T00:00:00Z",
    "updatedAt": "2026-05-27T00:00:00Z"
  }
}
```

### 400
Description: Bad request - Invalid match state or missing review notes
Type: object
Example response:
```json
{
  "message": "Review notes are required when rejecting a match result"
}
```

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

### 403
Description: Forbidden - User is not the chief referee of the tournament
Type: object
Example response:
```json
{
  "message": "Only the chief referee can perform this action"
}
```

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## GET /api/matches/{id}/elo-preview
Tag: Matches
Summary: Preview Elo score changes for a match

Calculate and preview how Elo scores will change for all players after match completion.
Displays expected vs actual scores and per-player Elo deltas.

Business Logic:
- Works on any match status (can preview before match is completed)
- Calculates based on current match state and set scores
- Shows average Elo for each entry
- Calculates expected win probability for each entry
- Shows actual match outcome (1 for winner, 0 for loser)
- Margin multiplier adjusts Elo change based on match difficulty
- Returns per-player Elo changes including:
  - userId: player ID
  - currentElo: current Elo rating
  - expectedElo: Elo if match had expected outcome
  - change: actual Elo change based on result

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Match ID to preview Elo changes

Request body:
None

Responses:
### 200
Description: Elo changes preview for match
Type: object
Body:
  - entryA: object
    - averageElo: number
    - expectedScore: number | Probability of winning (0-1)
    - actualScore: number | 1 if won, 0 if lost
  - entryB: object
    - averageElo: number
    - expectedScore: number | Probability of winning (0-1)
    - actualScore: number | 1 if won, 0 if lost
  - marginMultiplier: number | Adjustment factor based on match margin/difficulty
  - changes: array | Elo changes for each player in both entries
    - items: object
      - userId: integer
      - currentElo: integer
      - expectedElo: integer
      - change: integer | Actual Elo change (positive for winner, negative for loser)
Example response:
```json
{
  "entryA": {
    "averageElo": 1200.5,
    "expectedScore": 0.65,
    "actualScore": 1
  },
  "entryB": {
    "averageElo": 1150.3,
    "expectedScore": 0.35,
    "actualScore": 0
  },
  "marginMultiplier": 1.2,
  "changes": [
    {
      "userId": 10,
      "currentElo": 1200,
      "expectedElo": 1215,
      "change": 18
    }
  ]
}
```

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

### 403
Description: Insufficient permissions
Type: object
Example response:
```json
{
  "message": "Forbidden - insufficient permissions"
}
```

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## GET /api/matches/athlete/{userId}/upcoming
Tag: Matches
Summary: Get upcoming matches for an athlete

Retrieve list of matches that an athlete is participating in with status 'scheduled' or 'in_progress'.
These are matches the athlete will compete in soon or are currently being played.

Business Logic:
- Returns matches where user is member of either entryA or entryB
- Only includes matches with status 'scheduled' or 'in_progress'
- Sorted chronologically by scheduled time (ascending)
- Includes full match details: schedule, both entries with members, assigned referees
- Useful for athlete dashboard to see what matches are coming up

Auth: bearerAuth

Request parameters:
- userId (path) | type: integer | required | ID of the athlete/user
- page (query) | type: integer | Page number for pagination (1-indexed) | default: 1
- limit (query) | type: integer | Maximum number of records per page | default: 10

Request body:
None

Responses:
### 200
Description: List of upcoming matches for the athlete
Type: object
Body:
  - matches: array | Array of upcoming matches (scheduled or in_progress)
    - items: object
      - id: integer
      - scheduleId: integer
      - entryAId: integer
      - entryBId: integer
      - status: string | choices: scheduled, in_progress, completed, cancelled
      - winnerEntryId: integer
      - resultStatus: string | choices: pending, approved, rejected
      - schedule: object
        - id: integer
        - scheduledAt: string
      - entryA: object
        - id: integer
        - members: array
          - items: object
      - entryB: object
        - id: integer
        - members: array
          - items: object
      - matchReferees: array | Assigned referees for the match
        - items: object
      - createdAt: string
      - updatedAt: string
  - count: integer | Total count of upcoming matches for this user
  - offset: integer | Records offset for this page
  - limit: integer | Maximum records per page
Example response:
```json
{
  "matches": [
    {
      "id": 42,
      "scheduleId": 1,
      "entryAId": 1,
      "entryBId": 1,
      "status": "scheduled",
      "winnerEntryId": 1,
      "resultStatus": "pending",
      "schedule": {
        "id": 1,
        "scheduledAt": "2026-05-27T00:00:00Z"
      },
      "entryA": {
        "id": 1,
        "members": [
          null
        ]
      },
      "entryB": {
        "id": 1,
        "members": [
          null
        ]
      },
      "matchReferees": [
        null
      ],
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z"
    }
  ],
  "count": 5,
  "offset": 0,
  "limit": 10
}
```

### 400
Description: Invalid request data
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## GET /api/matches/athlete/{userId}/history
Tag: Matches
Summary: Get match history for an athlete

Retrieve list of completed and approved matches that an athlete has participated in.
Provides a complete history of all finished matches with final results and winners.

Business Logic:
- Returns matches where user is member of either entryA or entryB
- Only includes matches with status 'completed' AND resultStatus 'approved'
- Sorted by most recent first (newest matches first)
- Includes complete match details: all entries with members, set information, winner details
- Useful for athlete profile to show career history and past results

Auth: bearerAuth

Request parameters:
- userId (path) | type: integer | required | ID of the athlete/user
- page (query) | type: integer | Page number for pagination (1-indexed) | default: 1
- limit (query) | type: integer | Maximum number of records per page | default: 10

Request body:
None

Responses:
### 200
Description: List of completed matches (match history)
Type: object
Body:
  - matches: array | Array of completed and approved matches
    - items: object
      - id: integer
      - scheduleId: integer
      - entryAId: integer
      - entryBId: integer
      - status: string | choices: scheduled, in_progress, completed, cancelled
      - winnerEntryId: integer
      - resultStatus: string | choices: pending, approved, rejected
      - reviewNotes: string
      - schedule: object
        - id: integer
        - scheduledAt: string
        - roundNumber: integer
        - stage: string | choices: group, knockout
      - entryA: object
        - id: integer
        - members: array
          - items: object
      - entryB: object
        - id: integer
        - members: array
          - items: object
      - winnerEntry: object | The winning entry with members
        - id: integer
        - members: array
          - items: object
      - subMatches: array | Sub-matches with all sets played in this match
        - items: object
          - id: integer
          - matchSets: array
            - items: object
              - id: integer
              - subMatchId: integer | required
              - setNumber: integer | required
              - entryAScore: integer | default: 0
              - entryBScore: integer | default: 0
              - subMatch: object
              - createdAt: string
              - updatedAt: string
              - matchId: integer
      - matchReferees: array | Referees who officiated the match
      - createdAt: string
      - updatedAt: string
  - count: integer | Total count of history matches for this user
  - offset: integer | Records offset for this page
  - limit: integer | Maximum records per page
Example response:
```json
{
  "matches": [
    {
      "id": 42,
      "scheduleId": 1,
      "entryAId": 1,
      "entryBId": 1,
      "status": "completed",
      "winnerEntryId": 101,
      "resultStatus": "approved",
      "reviewNotes": "string",
      "schedule": {
        "id": 1,
        "scheduledAt": "2026-05-27T00:00:00Z",
        "roundNumber": 1,
        "stage": "group"
      },
      "entryA": {
        "id": 1,
        "members": [
          null
        ]
      },
      "entryB": {
        "id": 1,
        "members": [
          null
        ]
      },
      "winnerEntry": {
        "id": 1,
        "members": [
          null
        ]
      },
      "subMatches": [
        {
          "id": 1,
          "matchSets": [
            {
              "id": 1,
              "subMatchId": 1,
              "setNumber": 1,
              "entryAScore": 0,
              "entryBScore": 0,
              "subMatch": null,
              "createdAt": "2026-05-27T00:00:00Z",
              "updatedAt": "2026-05-27T00:00:00Z",
              "matchId": 1
            }
          ]
        }
      ],
      "matchReferees": [
        null
      ],
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z"
    }
  ],
  "count": 15,
  "offset": 0,
  "limit": 10
}
```

### 400
Description: Invalid request data
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---
