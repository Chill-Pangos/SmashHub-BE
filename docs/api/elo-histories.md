# ELO Histories

ELO history tracking endpoints

Total endpoints: 2

## GET /api/elo-histories/user/{userId}
Tag: ELO Histories
Summary: Get ELO history by user ID

Request parameters:
- userId (path) | type: integer | required
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
User's ELO history

---

## GET /api/elo-histories/match/{matchId}
Tag: ELO Histories
Summary: Get ELO history by match ID

Request parameters:
- matchId (path) | type: integer | required
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
ELO history for match

---
