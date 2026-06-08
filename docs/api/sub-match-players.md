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
List of players with team assignments

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
List of players in the specified team

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
List of sub-matches the member participated in

### 500

---
