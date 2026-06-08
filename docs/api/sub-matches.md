# Sub Matches

Sub-match management endpoints

Total endpoints: 6

## POST /api/sub-matches/create-from-format
Tag: Sub Matches
Summary: Create sub-matches from team format

Create sub-matches based on category's team format (e.g., "S-D-S" creates 3 sub-matches)

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - matchId: integer | required | ID of the match
  - teamFormat: string | required | Team format string (e.g., "S-D-S" for Singles-Doubles-Singles)
Example payload:
```json
{
  "matchId": 1,
  "teamFormat": "S-D-S"
}
```

Responses:
### 201
Description: Sub-matches created successfully
Type: array
Example response:
```json
[
  {
    "id": 1,
    "matchId": 1,
    "subMatchNumber": 1,
    "status": "scheduled",
    "winnerTeam": "A",
    "umpireId": 1,
    "assistantUmpireId": 1,
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
    ],
    "subMatchPlayers": [
      {
        "id": 1,
        "subMatchId": 1,
        "entryMemberId": 1,
        "team": "A",
        "entryMember": null,
        "createdAt": "2026-05-27T00:00:00Z",
        "updatedAt": "2026-05-27T00:00:00Z"
      }
    ],
    "createdAt": "2026-05-27T00:00:00Z",
    "updatedAt": "2026-05-27T00:00:00Z"
  }
]
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

## POST /api/sub-matches/{id}/start
Tag: Sub Matches
Summary: Start a sub-match

Start a sub-match and assign the requesting referee as umpire

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Description: Sub-match started successfully
Type: object
Example response:
```json
{
  "id": 1,
  "matchId": 1,
  "subMatchNumber": 1,
  "status": "scheduled",
  "winnerTeam": "A",
  "umpireId": 1,
  "assistantUmpireId": 1,
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
  ],
  "subMatchPlayers": [
    {
      "id": 1,
      "subMatchId": 1,
      "entryMemberId": 1,
      "team": "A",
      "entryMember": null,
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z"
    }
  ],
  "createdAt": "2026-05-27T00:00:00Z",
  "updatedAt": "2026-05-27T00:00:00Z"
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

## POST /api/sub-matches/{id}/finalize
Tag: Sub Matches
Summary: Finalize a sub-match

Complete a sub-match and determine winner based on sets won

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Description: Sub-match finalized successfully
Type: object
Example response:
```json
{
  "id": 1,
  "matchId": 1,
  "subMatchNumber": 1,
  "status": "scheduled",
  "winnerTeam": "A",
  "umpireId": 1,
  "assistantUmpireId": 1,
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
  ],
  "subMatchPlayers": [
    {
      "id": 1,
      "subMatchId": 1,
      "entryMemberId": 1,
      "team": "A",
      "entryMember": null,
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z"
    }
  ],
  "createdAt": "2026-05-27T00:00:00Z",
  "updatedAt": "2026-05-27T00:00:00Z"
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

## POST /api/sub-matches/{id}/assign-players
Tag: Sub Matches
Summary: Assign players to sub-match

Assign entry members to teams A and B for a sub-match

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
Required: yes
Type: object
Fields:
  - players: array | required
    - items: object
      - entryMemberId: integer | required
      - team: string | required | choices: A, B
Example payload:
```json
{
  "players": [
    {
      "entryMemberId": 1,
      "team": "A"
    }
  ]
}
```

Responses:
### 200
Description: Players assigned successfully
Type: array
Example response:
```json
[
  {
    "id": 1,
    "subMatchId": 1,
    "entryMemberId": 1,
    "team": "A",
    "entryMember": null,
    "createdAt": "2026-05-27T00:00:00Z",
    "updatedAt": "2026-05-27T00:00:00Z"
  }
]
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

## GET /api/sub-matches/match/{matchId}
Tag: Sub Matches
Summary: Get sub-matches by match ID

Retrieve all sub-matches for a specific match with sets and player assignments

Request parameters:
- matchId (path) | type: integer | required | ID of the match

Request body:
None

Responses:
### 200
Description: List of sub-matches
Type: object
Body:
  - subMatches: array
    - items: object
      - id: integer | Unique identifier
      - matchId: integer | required | Parent match ID
      - subMatchNumber: integer | required
      - status: string | required | Current status of the sub-match | choices: scheduled, in_progress, completed | default: "scheduled"
      - winnerTeam: string | Winning team (A or B) | choices: A, B
      - umpireId: integer | Referee ID assigned as umpire
      - assistantUmpireId: integer | Optional assistant umpire ID
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
      - subMatchPlayers: array
        - items: object
          - id: integer | Unique identifier
          - subMatchId: integer | required | Sub-match ID
          - entryMemberId: integer | required | Entry member ID (player)
          - team: string | required | Team assignment | choices: A, B
          - entryMember: object
          - createdAt: string
          - updatedAt: string
      - createdAt: string
      - updatedAt: string
  - pagination: object
    - total: integer | Total number of records
    - page: integer | Current page number
    - limit: integer | Records per page
    - totalPages: integer | Total number of pages
    - hasNextPage: boolean | Whether a next page exists
    - hasPrevPage: boolean | Whether a previous page exists
Example response:
```json
{
  "subMatches": [
    {
      "id": 1,
      "matchId": 1,
      "subMatchNumber": 1,
      "status": "scheduled",
      "winnerTeam": "A",
      "umpireId": 1,
      "assistantUmpireId": 1,
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
      ],
      "subMatchPlayers": [
        {
          "id": 1,
          "subMatchId": 1,
          "entryMemberId": 1,
          "team": "A",
          "entryMember": null,
          "createdAt": "2026-05-27T00:00:00Z",
          "updatedAt": "2026-05-27T00:00:00Z"
        }
      ],
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 1,
    "totalPages": 1,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```

### 500

---

## GET /api/sub-matches/{id}
Tag: Sub Matches
Summary: Get sub-match by ID

Get detailed information about a specific sub-match

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Description: Sub-match details
Type: object
Example response:
```json
{
  "id": 1,
  "matchId": 1,
  "subMatchNumber": 1,
  "status": "scheduled",
  "winnerTeam": "A",
  "umpireId": 1,
  "assistantUmpireId": 1,
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
  ],
  "subMatchPlayers": [
    {
      "id": 1,
      "subMatchId": 1,
      "entryMemberId": 1,
      "team": "A",
      "entryMember": null,
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z"
    }
  ],
  "createdAt": "2026-05-27T00:00:00Z",
  "updatedAt": "2026-05-27T00:00:00Z"
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
