# Matches

Match management endpoints

Total endpoints: 16

## POST /api/matches
Tag: Matches
Summary: Create a new match

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object

Responses:
### 201
Match created successfully

### 400
Description: Bad request
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

---

## GET /api/matches
Tag: Matches
Summary: Get all matches

Request parameters:
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
List of matches

---

## GET /api/matches/pending
Tag: Matches
Summary: Get all pending matches waiting for approval (Chief Referee)

Get list of matches with resultStatus = 'pending' that need chief referee approval.
These are matches where referees have submitted results but not yet approved.

Auth: bearerAuth

Request parameters:
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
List of pending matches

---

## GET /api/matches/schedule/{scheduleId}
Tag: Matches
Summary: Get matches by schedule ID

Request parameters:
- scheduleId (path) | type: integer | required
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
List of matches for schedule

---

## GET /api/matches/status/{status}
Tag: Matches
Summary: Get matches by status

Request parameters:
- status (path) | type: string | required
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
List of matches with specified status

---

## POST /api/matches/{id}/start
Tag: Matches
Summary: Start a match

Automatically assign 2 available referees and change match status from scheduled to in_progress

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Match started successfully with referees assigned

### 400
Bad request - Match is not in scheduled status or not enough available referees

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

---

## GET /api/matches/{id}/pending-with-elo
Tag: Matches
Summary: Get pending match with ELO preview (Chief Referee)

Get match details with pending status and preview of ELO changes.
This helps chief referee review the result and see how ELO will change before approval.

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Description: Pending match with ELO preview
Type: object
Body:
  - match: object | Match details
  - eloPreview: object | Preview of ELO changes for all players
Example response:
```json
{
  "match": null,
  "eloPreview": null
}
```

### 400
Bad request - Match is not in pending status

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

---

## POST /api/matches/{id}/finalize
Tag: Matches
Summary: Submit match result for approval (Referee)

Referee submits match result which will be in pending status:
- Check if a team has won enough sets (maxSets/2 + 1)
- Set match status to completed with resultStatus = pending
- Chief referee must approve before standings/brackets and Elo are updated

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Match result submitted, waiting for chief referee approval

### 400
Bad request - Match not in_progress or not enough sets completed

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

---

## POST /api/matches/{id}/approve
Tag: Matches
Summary: Approve match result (Chief Referee only)

Chief referee approves the pending match result:
- Update resultStatus to approved
- Update group standings or knockout brackets
- Calculate and update Elo scores for all players

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

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
Match result approved, standings/brackets and Elo updated

### 400
Bad request - Invalid match state

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

---

## POST /api/matches/{id}/reject
Tag: Matches
Summary: Reject match result (Chief Referee only)

Chief referee rejects the pending match result:
- Update resultStatus to rejected
- Reset match to in_progress status
- Clear winner so referee can resubmit

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
Required: yes
Type: object
Fields:
  - reviewNotes: string | required | Required notes explaining why the result was rejected
Example payload:
```json
{
  "reviewNotes": "string"
}
```

Responses:
### 200
Match result rejected, referee needs to resubmit

### 400
Bad request - Review notes required or invalid state

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

---

## GET /api/matches/{id}/elo-preview
Tag: Matches
Summary: Preview Elo changes for a match

Calculate and preview how Elo scores will change for all players after match completion.
Useful for checking expected Elo changes before finalizing the match.

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Description: Elo changes preview
Type: object
Body:
  - entryA: object
    - averageElo: number
    - expectedScore: number
    - actualScore: number
  - entryB: object
    - averageElo: number
    - expectedScore: number
    - actualScore: number
  - marginMultiplier: number
  - changes: array
    - items: object
      - userId: number
      - currentElo: number
      - expectedElo: number
      - change: number
Example response:
```json
{
  "entryA": {
    "averageElo": 1,
    "expectedScore": 1,
    "actualScore": 1
  },
  "entryB": {
    "averageElo": 1,
    "expectedScore": 1,
    "actualScore": 1
  },
  "marginMultiplier": 1,
  "changes": [
    {
      "userId": 1,
      "currentElo": 1,
      "expectedElo": 1,
      "change": 1
    }
  ]
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

---

## GET /api/matches/athlete/{userId}/upcoming
Tag: Matches
Summary: Get upcoming matches for an athlete

Get list of scheduled and in-progress matches that an athlete is participating in

Auth: bearerAuth

Request parameters:
- userId (path) | type: number | required | ID of the athlete/user
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
Description: List of upcoming matches
Type: object
Body:
  - matches: array
    - items: object
  - count: number
  - offset: number
  - limit: number
Example response:
```json
{
  "matches": [
    null
  ],
  "count": 1,
  "offset": 1,
  "limit": 1
}
```

### 400
Description: Bad request
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

---

## GET /api/matches/athlete/{userId}/history
Tag: Matches
Summary: Get match history for an athlete

Get list of completed matches that an athlete has participated in

Auth: bearerAuth

Request parameters:
- userId (path) | type: number | required | ID of the athlete/user
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
Description: List of completed matches (match history)
Type: object
Body:
  - matches: array
    - items: object
  - count: number
  - offset: number
  - limit: number
Example response:
```json
{
  "matches": [
    null
  ],
  "count": 1,
  "offset": 1,
  "limit": 1
}
```

### 400
Description: Bad request
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

---

## GET /api/matches/{id}
Tag: Matches
Summary: Get match by ID

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Match details

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

---

## PUT /api/matches/{id}
Tag: Matches
Summary: Update match

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Match updated

### 404
Description: Resource not found
Type: object
Example response:
```json
{
  "message": "Resource not found"
}
```

---

## DELETE /api/matches/{id}
Tag: Matches
Summary: Delete match

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 204
Successfully deleted, no content returned

---
