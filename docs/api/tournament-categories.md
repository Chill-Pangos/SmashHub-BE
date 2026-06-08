# Tournament Categories

Tournament category endpoints

Total endpoints: 6

## POST /api/tournament-categories
Tag: Tournament Categories
Summary: Create a new tournament category

Creates a new tournament category with match type and eligibility constraints.

**Validation Rules:**
- `gender = 'mixed'` is only valid when `type = 'double'`
- `maxEntries` must be greater than 0
- `maxSets` must be between 1 and 5
- If `type = 'team'`, both `numberOfSingles` and `numberOfDoubles` must be specified
- Age range: `minAge` should be less than or equal to `maxAge` (if both provided)
- ELO range: `minElo` should be less than or equal to `maxElo` (if both provided)

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - tournamentId: integer | required | The tournament this category belongs to
  - name: string | required | Display name for the category
  - type: string | required | Match format type - single, double, or team competition | choices: single, double, team
  - maxEntries: integer | required | Maximum number of entries allowed in this category
  - maxSets: integer | required | Maximum number of sets per match (best-of format)
  - numberOfSingles: integer | For team type - number of singles matches. Required for team type
  - numberOfDoubles: integer | For team type - number of doubles matches. Required for team type
  - minAge: integer | Minimum age requirement for participants (optional)
  - maxAge: integer | Maximum age requirement for participants (optional)
  - minElo: integer | Minimum ELO rating requirement (optional)
  - maxElo: integer | Maximum ELO rating cap for participants (optional)
  - gender: string | Gender category. 'mixed' only valid for double type | choices: male, female, mixed
  - isGroupStage: boolean | Whether this category uses group stage format
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
Description: Tournament category created successfully
Type: object
Example response:
```json
{
  "id": 1,
  "tournamentId": 1,
  "name": "Men's Singles",
  "type": "single",
  "maxEntries": 32,
  "maxSets": 3,
  "numberOfSingles": null,
  "numberOfDoubles": null,
  "minAge": 16,
  "maxAge": 45,
  "minElo": null,
  "maxElo": null,
  "gender": "male",
  "isGroupStage": false,
  "createdAt": "2024-05-27T10:30:00.000Z",
  "updatedAt": "2024-05-27T10:30:00.000Z"
}
```

### 400
Description: Invalid request data
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

### 403
Description: Insufficient permissions
Type: object
Example response:
```json
{
  "message": "Forbidden - insufficient permissions"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## GET /api/tournament-categories
Tag: Tournament Categories
Summary: List all tournament categories

Retrieves all tournament categories with pagination support.
Categories are returned as an array, sorted by creation date.

Request parameters:
- page (query) | type: integer | Page number for pagination (1-indexed) | default: 1
- limit (query) | type: integer | Maximum records per page | default: 10

Request body:
None

Responses:
### 200
Description: List of tournament categories retrieved successfully
Type: array
Example response:
```json
[
  {
    "id": 1,
    "tournamentId": 1,
    "name": "Men's Singles",
    "type": "single",
    "maxEntries": 32,
    "maxSets": 3,
    "numberOfSingles": null,
    "numberOfDoubles": null,
    "minAge": 16,
    "maxAge": 45,
    "minElo": null,
    "maxElo": null,
    "gender": "male",
    "isGroupStage": false,
    "createdAt": "2024-05-27T10:30:00.000Z",
    "updatedAt": "2024-05-27T10:30:00.000Z"
  },
  {
    "id": 2,
    "tournamentId": 1,
    "name": "Women's Doubles",
    "type": "double",
    "maxEntries": 16,
    "maxSets": 2,
    "numberOfSingles": null,
    "numberOfDoubles": null,
    "minAge": null,
    "maxAge": null,
    "minElo": 1000,
    "maxElo": 2000,
    "gender": "female",
    "isGroupStage": true,
    "createdAt": "2024-05-27T11:00:00.000Z",
    "updatedAt": "2024-05-27T11:00:00.000Z"
  }
]
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## GET /api/tournament-categories/{id}
Tag: Tournament Categories
Summary: Get tournament category by ID

Retrieves a specific tournament category with all its configuration details

Request parameters:
- id (path) | type: integer | required | The ID of the tournament category

Request body:
None

Responses:
### 200
Description: Tournament category retrieved successfully
Type: object
Example response:
```json
{
  "id": 1,
  "tournamentId": 1,
  "name": "Men's Singles",
  "type": "single",
  "maxEntries": 32,
  "maxSets": 3,
  "numberOfSingles": null,
  "numberOfDoubles": null,
  "minAge": 16,
  "maxAge": 45,
  "minElo": null,
  "maxElo": null,
  "gender": "male",
  "isGroupStage": false,
  "createdAt": "2024-05-27T10:30:00.000Z",
  "updatedAt": "2024-05-27T10:30:00.000Z"
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

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## PATCH /api/tournament-categories/{id}
Tag: Tournament Categories
Summary: Update tournament category

Updates one or more fields of an existing tournament category.

**Validation Rules:**
- If updating `gender` or `type`, the combination must be valid (mixed gender only for double type)
- All other field constraints from creation apply here as well
- Partial updates are supported - only include fields to update

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | The ID of the tournament category to update

Request body:
Required: yes
Type: object
Fields:
  - name: string | Display name for the category
  - type: string | Match format type | choices: single, double, team
  - maxEntries: integer | Maximum number of entries allowed
  - maxSets: integer | Maximum number of sets per match
  - numberOfSingles: integer | For team type - number of singles matches
  - numberOfDoubles: integer | For team type - number of doubles matches
  - minAge: integer | Minimum age requirement
  - maxAge: integer | Maximum age requirement
  - minElo: integer | Minimum ELO rating requirement
  - maxElo: integer | Maximum ELO rating cap
  - gender: string | Gender category. 'mixed' only valid for double type | choices: male, female, mixed
  - isGroupStage: boolean | Whether this category uses group stage format
Example payload:
```json
{
  "name": "Women's Singles",
  "type": "single",
  "maxEntries": 32,
  "maxSets": 3,
  "numberOfSingles": 3,
  "numberOfDoubles": 2,
  "minAge": 18,
  "maxAge": 40,
  "minElo": 1100,
  "maxElo": 2100,
  "gender": "female",
  "isGroupStage": true
}
```

Responses:
### 200
Description: Tournament category updated successfully
Type: object
Example response:
```json
{
  "id": 1,
  "tournamentId": 1,
  "name": "Women's Singles",
  "type": "single",
  "maxEntries": 32,
  "maxSets": 3,
  "numberOfSingles": null,
  "numberOfDoubles": null,
  "minAge": 18,
  "maxAge": 40,
  "minElo": 1100,
  "maxElo": 2100,
  "gender": "female",
  "isGroupStage": false,
  "createdAt": "2024-05-27T10:30:00.000Z",
  "updatedAt": "2024-05-27T12:45:00.000Z"
}
```

### 400
Description: Invalid request data
Type: object
Example response:
```json
{
  "message": "Invalid request data"
}
```

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

### 403
Description: Insufficient permissions
Type: object
Example response:
```json
{
  "message": "Forbidden - insufficient permissions"
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

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## DELETE /api/tournament-categories/{id}
Tag: Tournament Categories
Summary: Delete tournament category

Permanently deletes a tournament category.

**Warning:** Deleting a category may affect associated entries and schedules.
Ensure all related data is handled before deletion.

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | The ID of the tournament category to delete

Request body:
None

Responses:
### 204
Request processed successfully, no content returned

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

### 403
Description: Insufficient permissions
Type: object
Example response:
```json
{
  "message": "Forbidden - insufficient permissions"
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

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---

## GET /api/tournament-categories/tournament/{tournamentId}
Tag: Tournament Categories
Summary: Get categories by tournament ID

Retrieves all tournament categories for a specific tournament with pagination support.
Useful for loading the complete category configuration when organizing a tournament.

Request parameters:
- tournamentId (path) | type: integer | required | The ID of the tournament to retrieve categories for
- page (query) | type: integer | Page number for pagination (1-indexed) | default: 1
- limit (query) | type: integer | Maximum records per page | default: 10

Request body:
None

Responses:
### 200
Description: Tournament categories retrieved successfully
Type: array
Example response:
```json
[
  {
    "id": 1,
    "tournamentId": 5,
    "name": "Men's Singles",
    "type": "single",
    "maxEntries": 32,
    "maxSets": 3,
    "numberOfSingles": null,
    "numberOfDoubles": null,
    "minAge": 16,
    "maxAge": null,
    "minElo": null,
    "maxElo": null,
    "gender": "male",
    "isGroupStage": false,
    "createdAt": "2024-05-27T10:30:00.000Z",
    "updatedAt": "2024-05-27T10:30:00.000Z"
  },
  {
    "id": 2,
    "tournamentId": 5,
    "name": "Women's Doubles",
    "type": "double",
    "maxEntries": 16,
    "maxSets": 2,
    "numberOfSingles": null,
    "numberOfDoubles": null,
    "minAge": 18,
    "maxAge": 50,
    "minElo": 1000,
    "maxElo": 2200,
    "gender": "female",
    "isGroupStage": true,
    "createdAt": "2024-05-27T11:00:00.000Z",
    "updatedAt": "2024-05-27T11:00:00.000Z"
  },
  {
    "id": 3,
    "tournamentId": 5,
    "name": "Team Competition",
    "type": "team",
    "maxEntries": 8,
    "maxSets": 3,
    "numberOfSingles": 3,
    "numberOfDoubles": 1,
    "minAge": null,
    "maxAge": null,
    "minElo": 1200,
    "maxElo": null,
    "gender": "mixed",
    "isGroupStage": false,
    "createdAt": "2024-05-27T11:15:00.000Z",
    "updatedAt": "2024-05-27T11:15:00.000Z"
  }
]
```

### 404
Description: Tournament not found
Type: object
Example response:
```json
{
  "message": "Tournament not found"
}
```

### 500
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---
