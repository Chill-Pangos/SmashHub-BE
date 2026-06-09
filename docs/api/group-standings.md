# Group Standings

Group stage standing management endpoints

Total endpoints: 6

## POST /api/group-standings/generate
Tag: Group Standings
Summary: Generate group preview with random assignments

Generate a random group stage preview for organizer review.
This endpoint does not save data. Review the returned groups, then call /group-standings/save-assignments with approved assignments.

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - categoryId: integer | required
Example payload:
```json
{
  "categoryId": 1
}
```

Responses:
### 200
Description: Group preview generated successfully
Type: object
Body:
  - success: boolean
  - data: array
    - items: object
      - groupName: string
      - slots: integer
      - entryIds: array
        - items: integer
  - message: string
Example response:
```json
{
  "success": true,
  "data": [
    {
      "groupName": "Group A",
      "slots": 4,
      "entryIds": [
        5,
        12,
        3,
        8
      ]
    }
  ],
  "message": "Group preview generated successfully"
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

## POST /api/group-standings/save-assignments
Tag: Group Standings
Summary: Save group assignments to database

Persist approved group assignments to the database after organizer confirmation.
Creates initial GroupStanding records with all stats at zero (0 matches, 0 sets).

**Workflow**:
1. Organizer calls `/group-standings/generate-placeholders` to get preview
2. Reviews and optionally modifies group assignments
3. Calls this endpoint to finalize - REPLACES any existing standings for category

**What Gets Created**:
Each entry in each group gets a GroupStanding record initialized with:
- position: null (will be calculated after first match)
- matchesPlayed, matchesWon, matchesLost: 0
- setsWon, setsLost, setsDiff: 0

**Validation**:
- All entries must belong to the category
- No duplicate entries across groups
- All entries must be eligible (closed registration, proper member count)
- Replaces previous standings completely (transaction-safe)

**Authorization**: Only organizer of the tournament

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - categoryId: integer | required | Tournament category ID
  - groupAssignments: array | Group assignments (primary field name)
    - items: object
      - groupName: string | required | Unique group identifier (e.g., Group A, Group B)
      - entryIds: array | required | Team/entry IDs in this group
        - items: integer
  - assignments: array | Backward-compatible alias for groupAssignments (deprecated - use groupAssignments instead)
    - items: object
      - groupName: string
      - entryIds: array
        - items: integer
Example payload:
```json
{
  "categoryId": 1,
  "groupAssignments": [
    {
      "groupName": "Group A",
      "entryIds": [
        1,
        5,
        8,
        12
      ]
    }
  ],
  "assignments": [
    {
      "groupName": "Group B",
      "entryIds": [
        2,
        6,
        9,
        13
      ]
    }
  ]
}
```

Responses:
### 201
Description: Assignments saved successfully and GroupStanding records created
Type: object
Body:
  - success: boolean
  - data: array | Array of created GroupStanding records
    - items: object
      - id: integer
      - categoryId: integer | required
      - groupName: string | required
      - entryId: integer | required
      - matchesPlayed: integer | default: 0
      - matchesWon: integer | default: 0
      - matchesLost: integer | default: 0
      - setsWon: integer | default: 0
      - setsLost: integer | default: 0
      - setsDiff: integer | setsWon - setsLost | default: 0
      - position: integer
      - entry: object
      - createdAt: string
      - updatedAt: string
  - message: string
Example response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "categoryId": 1,
      "groupName": "Group A",
      "entryId": 1,
      "matchesPlayed": 0,
      "matchesWon": 0,
      "matchesLost": 0,
      "setsWon": 0,
      "setsLost": 0,
      "setsDiff": 0,
      "position": null,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "categoryId": 1,
      "groupName": "Group A",
      "entryId": 5,
      "matchesPlayed": 0,
      "matchesWon": 0,
      "matchesLost": 0,
      "setsWon": 0,
      "setsLost": 0,
      "setsDiff": 0,
      "position": null,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "message": "Group assignments saved successfully"
}
```

### 400
Description: Invalid request data or validation failed
Type: object
Body:
  - message: string | choices: categoryId must be a positive integer, groupAssignments must be an array of { groupName, entryIds[] }, Assignments must contain at least one entry, Duplicate entries found across groups, Some entries do not belong to this category, Registration must be closed before managing groups
Example response:
```json
{
  "message": "categoryId must be a positive integer"
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
Description: User is not the tournament organizer
Type: object
Body:
  - message: string
Example response:
```json
{
  "message": "Only the tournament organizer can perform this action"
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

## POST /api/group-standings/calculate
Tag: Group Standings
Summary: Recalculate group standings positions

Recalculate ranking positions for group standings based on current match statistics.
Applies three-tier tiebreaker system to determine final positions.

**Tie-Breaking Order** (applied in sequence):
1. **Matches Won (DESC)**: Primary ranking criterion
2. **Set Difference (DESC)**: Sets won - sets lost
3. **Head-to-Head Result**: Direct match result between tied teams
   - Looks up completed group stage matches between teams
   - Uses winner of direct match as tiebreaker
   - Query optimized with single pre-fetch to avoid N² lookups

**Usage**:
- Typically called after each group stage match completes
- Can be called manually to refresh all positions
- Optional groupName parameter to recalculate single group only
- If groupName omitted: recalculates ALL groups in category

**Performance**: H2H results pre-fetched once per recalculation (efficient)

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - categoryId: integer | required | Tournament category ID
  - groupName: string | Specific group name to recalculate (optional, all groups if omitted)
Example payload:
```json
{
  "categoryId": 1,
  "groupName": "Group A"
}
```

Responses:
### 200
Description: Standings recalculated successfully
Type: object
Body:
  - success: boolean
  - data: array
    - items: object
      - id: integer
      - categoryId: integer | required
      - groupName: string | required
      - entryId: integer | required
      - matchesPlayed: integer | default: 0
      - matchesWon: integer | default: 0
      - matchesLost: integer | default: 0
      - setsWon: integer | default: 0
      - setsLost: integer | default: 0
      - setsDiff: integer | setsWon - setsLost | default: 0
      - position: integer
      - entry: object
      - createdAt: string
      - updatedAt: string
  - message: string
Example response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "categoryId": 1,
      "groupName": "string",
      "entryId": 1,
      "matchesPlayed": 0,
      "matchesWon": 0,
      "matchesLost": 0,
      "setsWon": 0,
      "setsLost": 0,
      "setsDiff": 0,
      "position": 1,
      "entry": null,
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z"
    }
  ],
  "message": "Group standings recalculated successfully"
}
```

### 400
Description: Invalid request or no group standings found
Type: object
Body:
  - message: string
Example response:
```json
{
  "message": "No group standings found for this category"
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

## POST /api/group-standings/matches/{matchId}/sync
Tag: Group Standings
Summary: Update standings after group stage match completion

Update group standings statistics and rankings after a group stage match completes.
Called when referee marks a group stage match as completed and sets the winner.

**What This Does**:
1. Finds the completed match and its match sets
2. Counts sets won/lost for both teams
3. Updates both teams' standings:
   - matchesPlayed +1
   - matchesWon +1 (winner), matchesLost +1 (loser)
   - setsWon, setsLost (from all sets in match)
   - setsDiff recalculated (setsWon - setsLost)
4. Recalculates positions for the group using tiebreaker

**Authorization**: Only organizer of the tournament can call this

**Prerequisites**:
- Match must be in group stage (schedule.stage === "group")
- Match status must be "completed"
- Match must have a winner assigned
- Both entries must be in the same group

**Concurrency**: Uses row-level locking to prevent race conditions
if multiple matches in same group complete simultaneously

Auth: bearerAuth

Request parameters:
- matchId (path) | type: integer | required | Match ID to sync standings for

Request body:
None

Responses:
### 200
Description: Standings updated and positions recalculated successfully
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": true,
  "message": "Group standings updated successfully"
}
```

### 400
Description: Invalid match ID, match not found, or preconditions not met
Type: object
Body:
  - message: string | choices: matchId must be a positive integer, Match not found or not a group stage match, Match is not completed yet, Match has no winner
Example response:
```json
{
  "message": "matchId must be a positive integer"
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
Body:
  - message: string
Example response:
```json
{
  "message": "Only the tournament organizer can perform this action"
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

## GET /api/group-standings/{categoryId}
Tag: Group Standings
Summary: Get group standings for a category

Retrieve all group standings for a tournament category.
Results ordered by group name, then by position within each group.

**Response Fields**:
- **groupName**: Group identifier (e.g., "Group A")
- **position**: Current ranking in the group (null until first calculation)
- **matchesPlayed/Won/Lost**: Match statistics
- **setsWon/Lost**: Total sets counted across all matches
- **setsDiff**: Set differential (setsWon - setsLost)
- **entry**: Associated Entry object (if included via relationship)

**Optional Filtering**: Use groupName query parameter to filter single group

Request parameters:
- categoryId (path) | type: integer | required | Tournament category ID
- groupName (query) | type: string | Filter by specific group name (e.g., "Group A")

Request body:
None

Responses:
### 200
Description: Standings retrieved successfully
Type: object
Body:
  - success: boolean
  - data: array
    - items: object
      - id: integer
      - categoryId: integer | required
      - groupName: string | required
      - entryId: integer | required
      - matchesPlayed: integer | default: 0
      - matchesWon: integer | default: 0
      - matchesLost: integer | default: 0
      - setsWon: integer | default: 0
      - setsLost: integer | default: 0
      - setsDiff: integer | setsWon - setsLost | default: 0
      - position: integer
      - entry: object
      - createdAt: string
      - updatedAt: string
Example response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "categoryId": 1,
      "groupName": "Group A",
      "entryId": 5,
      "position": 1,
      "matchesPlayed": 3,
      "matchesWon": 3,
      "matchesLost": 0,
      "setsWon": 9,
      "setsLost": 1,
      "setsDiff": 8,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:45:00Z"
    },
    {
      "id": 2,
      "categoryId": 1,
      "groupName": "Group A",
      "entryId": 12,
      "position": 2,
      "matchesPlayed": 3,
      "matchesWon": 2,
      "matchesLost": 1,
      "setsWon": 7,
      "setsLost": 4,
      "setsDiff": 3,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:45:00Z"
    }
  ]
}
```

### 400
Description: Invalid category ID
Type: object
Body:
  - message: string
Example response:
```json
{
  "message": "categoryId must be a positive integer"
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

## GET /api/group-standings/{categoryId}/qualified
Tag: Group Standings
Summary: Get qualified teams advancing from group stage

Retrieve top N teams from each group that advance to knockout stage.
Returns grouped results by group name with pagination support.

**Qualification Logic**:
- Filters teams where position <= qualifiersPerGroup
- Each group must have at least qualifiersPerGroup ranked teams
- Returns {groupName, qualifiers[]} array (paginated)

**Position Calculation**:
- Positions must be calculated first via `/calculate` endpoint
- Uses three-tier tiebreaker (matchesWon, setsDiff, H2H)

**Pagination**:
- page: 1-based page number (default: 1)
- limit: results per page (default: 10)
- Response includes pagination metadata (total, totalPages, hasNextPage, hasPrevPage)

Request parameters:
- categoryId (path) | type: integer | required | Tournament category ID
- qualifiersPerGroup (query) | type: integer | Number of teams to qualify from each group (minimum 1) | default: 2
- teamsPerGroup (query) | type: integer | Legacy alias for qualifiersPerGroup (for backward compatibility) | default: 2
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Results per page | default: 10

Request body:
None

Responses:
### 200
Description: Qualified teams retrieved successfully
Type: object
Body:
  - success: boolean
  - data: object
    - qualifiers: array
      - items: object
        - groupName: string
        - qualifiers: array
          - items: object
            - id: integer
            - categoryId: integer | required
            - groupName: string | required
            - entryId: integer | required
            - matchesPlayed: integer | default: 0
            - matchesWon: integer | default: 0
            - matchesLost: integer | default: 0
            - setsWon: integer | default: 0
            - setsLost: integer | default: 0
            - setsDiff: integer | setsWon - setsLost | default: 0
            - position: integer
            - entry: object
            - createdAt: string
            - updatedAt: string
    - pagination: object
      - total: integer
      - page: integer
      - limit: integer
      - totalPages: integer
      - hasNextPage: boolean
      - hasPrevPage: boolean
Example response:
```json
{
  "success": true,
  "data": {
    "qualifiers": [
      {
        "groupName": "Group A",
        "qualifiers": [
          {
            "id": 1,
            "categoryId": 1,
            "groupName": "Group A",
            "entryId": 5,
            "position": 1,
            "matchesPlayed": 3,
            "matchesWon": 3,
            "matchesLost": 0,
            "setsWon": 9,
            "setsLost": 1,
            "setsDiff": 8
          },
          {
            "id": 2,
            "categoryId": 1,
            "groupName": "Group A",
            "entryId": 12,
            "position": 2,
            "matchesPlayed": 3,
            "matchesWon": 2,
            "matchesLost": 1,
            "setsWon": 7,
            "setsLost": 4,
            "setsDiff": 3
          }
        ]
      },
      {
        "groupName": "Group B",
        "qualifiers": [
          {
            "id": 5,
            "categoryId": 1,
            "groupName": "Group B",
            "entryId": 8,
            "position": 1,
            "matchesPlayed": 3,
            "matchesWon": 3,
            "matchesLost": 0,
            "setsWon": 8,
            "setsLost": 2,
            "setsDiff": 6
          },
          {
            "id": 6,
            "categoryId": 1,
            "groupName": "Group B",
            "entryId": 9,
            "position": 2,
            "matchesPlayed": 3,
            "matchesWon": 2,
            "matchesLost": 1,
            "setsWon": 6,
            "setsLost": 5,
            "setsDiff": 1
          }
        ]
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

### 400
Description: Invalid parameters
Type: object
Body:
  - message: string | choices: categoryId must be a positive integer, qualifiersPerGroup must be a positive integer, No standings found for this category, Some standings have not been ranked yet
Example response:
```json
{
  "message": "categoryId must be a positive integer"
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
