# ELO Scores

ELO scoring system endpoints

Total endpoints: 1

## GET /api/elo-scores/leaderboard
Tag: ELO Scores
Summary: Get ELO leaderboard

Returns ELO scores sorted by score in descending order

Request parameters:
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
Leaderboard data ordered by score

---
