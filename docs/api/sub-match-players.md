# Sub Match Players

Sub-match player assignment endpoints

Total endpoints: 3

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
