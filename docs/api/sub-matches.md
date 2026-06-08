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
Sub-matches created successfully

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
Sub-match started successfully

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
Sub-match finalized successfully

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
Players assigned successfully

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
List of sub-matches

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
Sub-match details

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
