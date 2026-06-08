# Tournament Categories

Tournament category endpoints

Total endpoints: 6

## POST /api/tournament-categories
Tag: Tournament Categories
Summary: Create a new tournament category

Note: gender = mixed is only valid when type = double

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - tournamentId: integer | required
  - name: string | required
  - type: string | required | choices: single, team, double
  - maxEntries: integer | required
  - maxSets: integer | required
  - numberOfSingles: integer
  - numberOfDoubles: integer
  - minAge: integer
  - maxAge: integer
  - minElo: integer
  - maxElo: integer
  - gender: string | choices: male, female, mixed
  - isGroupStage: boolean
Example payload:
```json
{
  "tournamentId": 1,
  "name": "Men's Singles",
  "type": "single",
  "maxEntries": 32,
  "maxSets": 3,
  "numberOfSingles": 3,
  "numberOfDoubles": 2,
  "minAge": 16,
  "maxAge": 35,
  "minElo": 1000,
  "maxElo": 2200,
  "gender": "male",
  "isGroupStage": false
}
```

Responses:
### 201
Tournament category created successfully

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

## GET /api/tournament-categories
Tag: Tournament Categories
Summary: Get all tournament categories

Request parameters:
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
List of tournament categories

---

## GET /api/tournament-categories/{id}
Tag: Tournament Categories
Summary: Get tournament category by ID

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Tournament category details

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

## PUT /api/tournament-categories/{id}
Tag: Tournament Categories
Summary: Update tournament category

Note: gender = mixed is only valid when type = double

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
Required: yes
Type: object
Fields:
  - name: string
  - type: string | choices: single, team, double
  - maxEntries: integer
  - maxSets: integer
  - numberOfSingles: integer
  - numberOfDoubles: integer
  - minAge: integer
  - maxAge: integer
  - minElo: integer
  - maxElo: integer
  - gender: string | choices: male, female, mixed
  - isGroupStage: boolean
Example payload:
```json
{
  "name": "Women's Singles",
  "type": "single",
  "maxEntries": 32,
  "maxSets": 3,
  "numberOfSingles": 3,
  "numberOfDoubles": 2,
  "minAge": 16,
  "maxAge": 35,
  "minElo": 1000,
  "maxElo": 2200,
  "gender": "female",
  "isGroupStage": false
}
```

Responses:
### 200
Tournament category updated

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

## DELETE /api/tournament-categories/{id}
Tag: Tournament Categories
Summary: Delete tournament category

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 204
Successfully deleted, no content returned

---

## GET /api/tournament-categories/tournament/{tournamentId}
Tag: Tournament Categories
Summary: Get tournament categories by tournament ID

Request parameters:
- tournamentId (path) | type: integer | required
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
List of tournament categories

---
