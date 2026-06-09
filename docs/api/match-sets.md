# Match Sets

Match set endpoints

Total endpoints: 8

## POST /api/match-sets
Tag: Match Sets
Summary: Create a new match set with score

Create a new set with validated score following badminton/table tennis rules

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - subMatchId: integer | required | ID of the sub-match
  - entryAScore: integer | required | Final score of Entry A
  - entryBScore: integer | required | Final score of Entry B
Example payload:
```json
{
  "subMatchId": 1,
  "entryAScore": 11,
  "entryBScore": 9
}
```

Responses:
### 201
Description: Match set created successfully
Type: object
Example response:
```json
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

## PUT /api/match-sets/live-score
Tag: Match Sets
Summary: Update live set score

Stores point-by-point score in Redis. System calculates current set number unless setNumber is provided. Sending the same setNumber again overwrites the live score, so referees can correct mistyped points. If the set was already persisted, this corrects the saved set while the sub-match is still in progress.

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - subMatchId: integer | required
  - setNumber: integer | Optional set number to correct. Defaults to current unfinished set.
  - entryAScore: integer | required
  - entryBScore: integer | required
Example payload:
```json
{
  "subMatchId": 1,
  "setNumber": 1,
  "entryAScore": 8,
  "entryBScore": 5
}
```

Responses:
### 200
Description: Live score cached, set not completed
Type: object
Body:
  - message: string
  - liveScore: object
    - subMatchId: integer
    - setNumber: integer
    - entryAScore: integer
    - entryBScore: integer
    - updatedBy: integer
    - updatedAt: string
  - isCompleted: boolean
  - nextSetNumber: integer
Example response:
```json
{
  "message": "success",
  "liveScore": {
    "subMatchId": 1,
    "setNumber": 2,
    "entryAScore": 8,
    "entryBScore": 5,
    "updatedBy": 12,
    "updatedAt": "2026-06-09T08:10:00.000Z"
  },
  "isCompleted": false,
  "nextSetNumber": 2
}
```

### 201
Description: Set completed and persisted to DB; may require referee finalize/submit
Type: object
Body:
  - message: string
  - liveScore: object
  - isCompleted: boolean
  - persistedSet: object
    - id: integer
    - subMatchId: integer | required
    - setNumber: integer | required
    - entryAScore: integer | default: 0
    - entryBScore: integer | default: 0
    - subMatch: object
    - createdAt: string
    - updatedAt: string
    - matchId: integer
  - nextSetNumber: integer
  - subMatchReadyToFinalize: boolean
  - winningTeam: string | choices: A, B
  - finalizationNotice: object
Example response:
```json
{
  "message": "string",
  "liveScore": null,
  "isCompleted": true,
  "persistedSet": {
    "id": 1,
    "subMatchId": 1,
    "setNumber": 1,
    "entryAScore": 0,
    "entryBScore": 0,
    "subMatch": null,
    "createdAt": "2026-05-27T00:00:00Z",
    "updatedAt": "2026-05-27T00:00:00Z",
    "matchId": 1
  },
  "nextSetNumber": 1,
  "subMatchReadyToFinalize": true,
  "winningTeam": "A",
  "finalizationNotice": null
}
```

---

## POST /api/match-sets/final-score
Tag: Match Sets
Summary: Submit final set score

Fallback API when Redis live score is missing. Validates final score and persists to DB.

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - subMatchId: integer | required
  - setNumber: integer | Optional current set number. Defaults to next unfinished set.
  - entryAScore: integer | required
  - entryBScore: integer | required
Example payload:
```json
{
  "subMatchId": 1,
  "setNumber": 1,
  "entryAScore": 11,
  "entryBScore": 9
}
```

Responses:
### 201
Description: Final set score persisted
Type: object
Example response:
```json
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
```

---

## GET /api/match-sets/sub-match/{subMatchId}/live-score
Tag: Match Sets
Summary: Get live set score from Redis

Request parameters:
- subMatchId (path) | type: integer | required
- setNumber (query) | type: integer | Optional set number. Defaults to next unfinished set.

Request body:
None

Responses:
### 200
Current live score or null if cache missing

---

## GET /api/match-sets/sub-match/{subMatchId}
Tag: Match Sets
Summary: Get match sets by sub-match ID

Retrieve all sets for a specific sub-match ordered by set number

Auth: bearerAuth

Request parameters:
- subMatchId (path) | type: integer | required | ID of the sub-match

Request body:
None

Responses:
### 200
Description: List of match sets ordered by set number
Type: object
Body:
  - message: string | required
  - subMatchId: integer | required
  - count: integer | required
  - sets: array | required
    - items: object
Example response:
```json
{
  "message": "Match sets retrieved successfully",
  "subMatchId": 88,
  "count": 2,
  "sets": [
    {
      "id": 501,
      "subMatchId": 88,
      "setNumber": 1,
      "entryAScore": 21,
      "entryBScore": 18,
      "createdAt": "2026-06-09T08:10:00.000Z",
      "updatedAt": "2026-06-09T08:10:00.000Z"
    },
    {
      "id": 502,
      "subMatchId": 88,
      "setNumber": 2,
      "entryAScore": 19,
      "entryBScore": 21,
      "createdAt": "2026-06-09T08:20:00.000Z",
      "updatedAt": "2026-06-09T08:20:00.000Z"
    }
  ]
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

## GET /api/match-sets/{id}
Tag: Match Sets
Summary: Get match set by ID

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Description: Match set details
Type: object
Example response:
```json
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

## PUT /api/match-sets/{id}
Tag: Match Sets
Summary: Update match set score

Update scores for an existing set (only allowed during sub-match in progress)

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
Required: yes
Type: object
Fields:
  - entryAScore: integer | required
  - entryBScore: integer | required
Example payload:
```json
{
  "entryAScore": 11,
  "entryBScore": 9
}
```

Responses:
### 200
Description: Match set updated
Type: object
Example response:
```json
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

## DELETE /api/match-sets/{id}
Tag: Match Sets
Summary: Delete match set

Delete the latest set (only allowed during sub-match in progress)

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 204
Successfully deleted, no content returned

---
