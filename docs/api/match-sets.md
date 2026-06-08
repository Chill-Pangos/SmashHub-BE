# Match Sets

Match set endpoints

Total endpoints: 5

## POST /api/match-sets
Tag: Match Sets
Summary: Create a new match set with score

Create a new set with validated score following badminton/table tennis rules

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - subMatchId: integer | required | ID of the sub-match
  - entryAScore: integer | required | Final score of Entry A
  - entryBScore: integer | required | Final score of Entry B
Example payload:
```json
{
  "subMatchId": 1,
  "entryAScore": 11,
  "entryBScore": 9
}
```

Responses:
### 201
Description: Match set created successfully
Type: object
Example response:
```json
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

## GET /api/match-sets/{id}
Tag: Match Sets
Summary: Get match set by ID

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Description: Match set details
Type: object
Example response:
```json
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

## PUT /api/match-sets/{id}
Tag: Match Sets
Summary: Update match set score

Update scores for an existing set (only allowed during sub-match in progress)

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
Required: yes
Type: object
Fields:
  - entryAScore: integer | required
  - entryBScore: integer | required
Example payload:
```json
{
  "entryAScore": 11,
  "entryBScore": 9
}
```

Responses:
### 200
Description: Match set updated
Type: object
Example response:
```json
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

## DELETE /api/match-sets/{id}
Tag: Match Sets
Summary: Delete match set

Delete the latest set (only allowed during sub-match in progress)

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 204
Successfully deleted, no content returned

---

## GET /api/match-sets/sub-match/{subMatchId}
Tag: Match Sets
Summary: Get match sets by sub-match ID

Retrieve all sets for a specific sub-match ordered by set number

Request parameters:
- subMatchId (path) | type: integer | required | ID of the sub-match

Request body:
None

Responses:
### 200
Description: List of match sets ordered by set number
Type: object
Body:
  - sets: array
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
  "sets": [
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

---
