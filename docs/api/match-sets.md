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
Match set created successfully

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
Match set details

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
Match set updated

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
List of match sets ordered by set number

---
