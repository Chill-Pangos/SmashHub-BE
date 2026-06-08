# ELO Histories

ELO history tracking endpoints

Total endpoints: 6

## POST /api/elo-histories
Tag: ELO Histories
Summary: Create a new ELO history entry

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object

Responses:
### 201
ELO history entry created successfully

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

## GET /api/elo-histories
Tag: ELO Histories
Summary: Get all ELO history entries

Returns ELO history ordered by creation date (newest first)

Request parameters:
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
List of ELO history entries

---

## GET /api/elo-histories/{id}
Tag: ELO Histories
Summary: Get ELO history entry by ID

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
ELO history entry details

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

## DELETE /api/elo-histories/{id}
Tag: ELO Histories
Summary: Delete ELO history entry

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 204
Successfully deleted, no content returned

---

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
