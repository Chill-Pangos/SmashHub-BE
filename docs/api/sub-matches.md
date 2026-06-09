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

Start a scheduled sub-match.
Only assigned umpire or assistant umpire can start.
Match must be in_progress and both teams must have approved lineups.

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Description: Sub-match started successfully
Type: object
Body:
  - message: string | required
  - lineupReady: boolean | required
  - subMatch: object | required
Example response:
```json
{
  "message": "Sub-match started successfully",
  "lineupReady": true,
  "subMatch": {
    "id": 88,
    "matchId": 42,
    "subMatchNumber": 1,
    "status": "in_progress",
    "winnerTeam": null,
    "umpireId": 21,
    "assistantUmpireId": 22,
    "createdAt": "2026-06-09T08:00:00.000Z",
    "updatedAt": "2026-06-09T08:30:00.000Z",
    "matchSets": [],
    "subMatchPlayers": [
      {
        "id": 900,
        "subMatchId": 88,
        "entryMemberId": 301,
        "team": "A",
        "entryMember": {
          "id": 301,
          "entryId": 101,
          "userId": 11
        }
      },
      {
        "id": 901,
        "subMatchId": 88,
        "entryMemberId": 302,
        "team": "B",
        "entryMember": {
          "id": 302,
          "entryId": 102,
          "userId": 12
        }
      }
    ]
  }
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

Complete a sub-match and determine winner based on sets won.
Only assigned umpire or assistant umpire can finalize.
This endpoint only finalizes sub-match. It does not submit/finalize match.
When enough sub-matches are won, response returns matchReadyToFinalize = true.

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Description: Sub-match finalized successfully
Type: object
Body:
  - message: string | required
  - matchReadyToFinalize: boolean | required
  - subMatch: object | required
Example response:
```json
{
  "message": "Sub-match finalized. Match is ready to finalize.",
  "matchReadyToFinalize": true,
  "subMatch": {
    "id": 88,
    "matchId": 42,
    "subMatchNumber": 1,
    "status": "completed",
    "winnerTeam": "A",
    "umpireId": 21,
    "assistantUmpireId": 22,
    "createdAt": "2026-06-09T08:00:00.000Z",
    "updatedAt": "2026-06-09T08:45:00.000Z"
  }
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

Auth: bearerAuth

Request parameters:
- matchId (path) | type: integer | required | ID of the match

Request body:
None

Responses:
### 200
Description: List of sub-matches
Type: object
Body:
  - message: string | required
  - matchId: integer | required
  - count: integer | required
  - subMatches: array | required
    - items: object
Example response:
```json
{
  "message": "Sub-matches retrieved successfully",
  "matchId": 42,
  "count": 2,
  "subMatches": [
    {
      "id": 88,
      "matchId": 42,
      "subMatchNumber": 1,
      "status": "completed",
      "winnerTeam": "A",
      "umpireId": 21,
      "assistantUmpireId": 22,
      "createdAt": "2026-06-09T08:00:00.000Z",
      "updatedAt": "2026-06-09T08:30:00.000Z",
      "umpire": {
        "id": 21,
        "firstName": "Le",
        "lastName": "Referee",
        "email": "referee@example.com"
      },
      "assistantUmpire": {
        "id": 22,
        "firstName": "Pham",
        "lastName": "Assistant",
        "email": "assistant@example.com"
      },
      "matchSets": [
        {
          "id": 501,
          "subMatchId": 88,
          "setNumber": 1,
          "entryAScore": 21,
          "entryBScore": 18,
          "createdAt": "2026-06-09T08:10:00.000Z",
          "updatedAt": "2026-06-09T08:10:00.000Z"
        }
      ],
      "subMatchPlayers": [
        {
          "id": 900,
          "subMatchId": 88,
          "entryMemberId": 301,
          "team": "A",
          "entryMember": {
            "id": 301,
            "entryId": 101,
            "userId": 11,
            "user": {
              "id": 11,
              "firstName": "Nguyen",
              "lastName": "An"
            }
          }
        }
      ]
    },
    {
      "id": 89,
      "matchId": 42,
      "subMatchNumber": 2,
      "status": "scheduled",
      "winnerTeam": null,
      "umpireId": 21,
      "assistantUmpireId": 22,
      "matchSets": [],
      "subMatchPlayers": []
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
