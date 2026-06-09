# Sub Match Players

Sub-match player assignment endpoints

Total endpoints: 8

## POST /api/sub-match-players/match/{matchId}/lineup-submit
Tag: Sub Match Players
Summary: Captain submits team lineup for all sub-matches

Captain submits lineup for every sub-match in a match.
Captain does not send team A/B; system detects team from match entryAId/entryBId.
Submitted lineups are stored as pending requests in Redis.
Data is written to sub_match_players only after umpire approval.

Auth: bearerAuth

Request parameters:
- matchId (path) | type: integer | required | Match ID

Request body:
Required: yes
Type: object
Fields:
  - lineups: array | required
    - items: object
      - subMatchId: integer | required
      - entryMemberIds: array | required
        - items: integer
Example payload:
```json
{
  "lineups": [
    {
      "subMatchId": 88,
      "entryMemberIds": [
        301,
        302
      ]
    }
  ]
}
```

Responses:
### 202
Description: Lineups submitted and waiting for umpire approval
Type: object
Body:
  - message: string | required
  - lineups: array | required
    - items: object
Example response:
```json
{
  "message": "Lineups submitted. Waiting for umpire approval.",
  "lineups": [
    {
      "subMatchId": 88,
      "matchId": 42,
      "team": "A",
      "captainId": 11,
      "umpireId": 21,
      "entryId": 101,
      "entryMemberIds": [
        301
      ],
      "status": "pending"
    },
    {
      "subMatchId": 89,
      "matchId": 42,
      "team": "A",
      "captainId": 11,
      "umpireId": 21,
      "entryId": 101,
      "entryMemberIds": [
        302,
        303
      ],
      "status": "pending"
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

### 401

---

## GET /api/sub-match-players/lineup-requests/pending
Tag: Sub Match Players
Summary: Umpire gets pending lineup requests

Retrieve pending lineup requests assigned to current umpire.

Auth: bearerAuth

Request parameters:
None

Request body:
None

Responses:
### 200
Description: Pending lineup requests
Type: object
Body:
  - lineups: array | required
    - items: object
Example response:
```json
{
  "lineups": [
    {
      "subMatchId": 88,
      "matchId": 42,
      "team": "A",
      "captainId": 11,
      "umpireId": 21,
      "entryId": 101,
      "entryMemberIds": [
        301
      ],
      "status": "pending"
    },
    {
      "subMatchId": 88,
      "matchId": 42,
      "team": "B",
      "captainId": 12,
      "umpireId": 21,
      "entryId": 102,
      "entryMemberIds": [
        401
      ],
      "status": "pending"
    }
  ]
}
```

### 401

---

## POST /api/sub-match-players/match/{matchId}/lineup-approve
Tag: Sub Match Players
Summary: Umpire approves pending lineups for a match

Umpire approves all pending lineups for this match.
Approved lineups are persisted into sub_match_players table.

Auth: bearerAuth

Request parameters:
- matchId (path) | type: integer | required | Match ID

Request body:
None

Responses:
### 200
Description: Lineups approved and saved
Type: object
Body:
  - message: string | required
  - players: array | required
    - items: object
      - id: integer | Unique identifier
      - subMatchId: integer | required | Sub-match ID
      - entryMemberId: integer | required | Entry member ID (player)
      - team: string | required | Team assignment | choices: A, B
      - entryMember: object
      - createdAt: string
      - updatedAt: string
Example response:
```json
{
  "message": "Lineup approved and saved.",
  "players": [
    {
      "id": 900,
      "subMatchId": 88,
      "entryMemberId": 301,
      "team": "A"
    },
    {
      "id": 901,
      "subMatchId": 88,
      "entryMemberId": 401,
      "team": "B"
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

### 401

---

## POST /api/sub-match-players/match/{matchId}/lineup-reject
Tag: Sub Match Players
Summary: Umpire rejects pending lineups for a match

Umpire rejects pending lineup requests for this match.
Pending requests are removed. Captain must submit updated lineup.

Auth: bearerAuth

Request parameters:
- matchId (path) | type: integer | required | Match ID

Request body:
Required: no
Type: object
Fields:
  - reviewNotes: string
Example payload:
```json
{
  "reviewNotes": "Player order invalid. Please resubmit lineup."
}
```

Responses:
### 200
Description: Lineups rejected
Type: object
Body:
  - message: string | required
  - rejected: array | required
    - items: object
Example response:
```json
{
  "message": "Lineup rejected. Captain must submit updated lineup.",
  "rejected": [
    {
      "subMatchId": 88,
      "matchId": 42,
      "team": "A",
      "captainId": 11,
      "umpireId": 21,
      "entryId": 101,
      "entryMemberIds": [
        301
      ],
      "status": "rejected",
      "reviewNotes": "Player order invalid. Please resubmit lineup."
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

### 401

---

## GET /api/sub-match-players/lineup-requests/rejected
Tag: Sub Match Players
Summary: Captain gets rejected lineup requests

Retrieve rejected lineup requests for current captain.

Auth: bearerAuth

Request parameters:
None

Request body:
None

Responses:
### 200
Description: Rejected lineup requests
Type: object
Body:
  - rejected: array | required
    - items: object
Example response:
```json
{
  "rejected": [
    {
      "subMatchId": 88,
      "matchId": 42,
      "team": "A",
      "captainId": 11,
      "umpireId": 21,
      "entryId": 101,
      "entryMemberIds": [
        301
      ],
      "status": "rejected",
      "reviewNotes": "Player order invalid. Please resubmit lineup."
    }
  ]
}
```

### 401

---

## GET /api/sub-match-players/sub-match/{subMatchId}
Tag: Sub Match Players
Summary: Get all players in a sub-match

Retrieve all players assigned to a specific sub-match with their team assignments

Request parameters:
- subMatchId (path) | type: integer | required | ID of the sub-match

Request body:
None

Responses:
### 200
Description: List of players with team assignments
Type: object
Body:
  - players: array
    - items: object
      - id: integer | Unique identifier
      - subMatchId: integer | required | Sub-match ID
      - entryMemberId: integer | required | Entry member ID (player)
      - team: string | required | Team assignment | choices: A, B
      - entryMember: object
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
  "players": [
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

## GET /api/sub-match-players/sub-match/{subMatchId}/team/{team}
Tag: Sub Match Players
Summary: Get players by team

Retrieve all players assigned to a specific team (A or B) in a sub-match

Request parameters:
- subMatchId (path) | type: integer | required | ID of the sub-match
- team (path) | type: string | required | Team identifier (A or B) | choices: A, B

Request body:
None

Responses:
### 200
Description: List of players in the specified team
Type: object
Body:
  - players: array
    - items: object
      - id: integer | Unique identifier
      - subMatchId: integer | required | Sub-match ID
      - entryMemberId: integer | required | Entry member ID (player)
      - team: string | required | Team assignment | choices: A, B
      - entryMember: object
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
  "players": [
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

### 400
Invalid team parameter

### 500

---

## GET /api/sub-match-players/entry-member/{entryMemberId}
Tag: Sub Match Players
Summary: Get sub-match history by entry member

Retrieve all sub-matches that an entry member has participated in

Request parameters:
- entryMemberId (path) | type: integer | required | ID of the entry member
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
Description: List of sub-matches the member participated in
Type: object
Body:
  - matches: array
    - items: object
      - id: integer | Unique identifier
      - subMatchId: integer | required | Sub-match ID
      - entryMemberId: integer | required | Entry member ID (player)
      - team: string | required | Team assignment | choices: A, B
      - entryMember: object
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
  "matches": [
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
