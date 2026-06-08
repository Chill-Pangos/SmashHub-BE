# ELO Scores

ELO scoring system endpoints

Total endpoints: 6

## POST /api/elo-scores
Tag: ELO Scores
Summary: Create a new ELO score

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object

Responses:
### 201
ELO score created successfully

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

## GET /api/elo-scores
Tag: ELO Scores
Summary: Get all ELO scores

Request parameters:
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
List of ELO scores

---

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

## GET /api/elo-scores/{id}
Tag: ELO Scores
Summary: Get ELO score by ID

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
ELO score details

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

## PUT /api/elo-scores/{id}
Tag: ELO Scores
Summary: Update ELO score

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
ELO score updated

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

## DELETE /api/elo-scores/{id}
Tag: ELO Scores
Summary: Delete ELO score

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 204
Successfully deleted, no content returned

---
