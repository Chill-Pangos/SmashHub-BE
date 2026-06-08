# Tournaments

Tournament management endpoints

Total endpoints: 10

## POST /api/tournaments
Tag: Tournaments
Summary: Create a new tournament

Create a new tournament with optional categories

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Example payload:
```json
{
  "name": "string",
  "introduction": "string",
  "tier": 1,
  "location": "string",
  "status": "upcoming",
  "categories": [
    {
      "name": "string",
      "type": "single",
      "maxEntries": 1,
      "maxSets": 5,
      "teamFormat": "string",
      "minAge": 1,
      "maxAge": 1,
      "minElo": 1,
      "maxElo": 1,
      "maxMembersPerEntry": 1,
      "gender": "male",
      "isGroupStage": false
    }
  ]
}
```

Responses:
### 201
Description: Tournament created successfully with all related categories
Type: object
Example response:
```json
{
  "id": 1,
  "name": "string",
  "introduction": "string",
  "tier": 1,
  "status": "upcoming",
  "location": "string",
  "createdBy": 1,
  "categories": [
    {
      "id": 1,
      "tournamentId": 1,
      "name": "string",
      "type": "single",
      "maxEntries": 1,
      "maxSets": 1,
      "teamFormat": "string",
      "minAge": 1,
      "maxAge": 1,
      "minElo": 1,
      "maxElo": 1,
      "maxMembersPerEntry": 1,
      "gender": "male",
      "isGroupStage": true,
      "entryFee": 0,
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z",
      "numberOfSingles": 1,
      "numberOfDoubles": 1
    }
  ],
  "createdAt": "2026-05-27T00:00:00Z",
  "updatedAt": "2026-05-27T00:00:00Z",
  "startDate": "2026-05-27T00:00:00Z",
  "endDate": "2026-05-27T00:00:00Z",
  "numberOfTables": 1
}
```

### 400
Description: Bad request - Invalid input data
Type: object
Body:
  - message: string
  - error: object
Example response:
```json
{
  "message": "Error creating tournament",
  "error": null
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

### 500
Description: Internal server error
Type: object
Body:
  - message: string
Example response:
```json
{
  "message": "Transaction failed"
}
```

---

## GET /api/tournaments
Tag: Tournaments
Summary: Get all tournaments with pagination

Get all tournaments with their categories and pagination information.
Note: Date and table configuration is managed in ScheduleConfig.

Request parameters:
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
Description: List of tournaments with pagination
Type: object
Body:
  - tournaments: array
    - items: object
      - id: integer | Tournament ID
      - name: string | required | Tournament name
      - introduction: string | Tournament introduction
      - tier: integer | required | Tournament tier level
      - status: string | Current status of the tournament | choices: upcoming, ongoing, completed, brackets_generated, ongoing, completed, cancelled | default: "upcoming"
      - location: string | required | Tournament venue location
      - createdBy: integer | required | ID of the user who created this tournament
      - categories: array
        - items: object
          - id: integer | Category ID
          - tournamentId: integer | required | ID of the tournament this category belongs to
          - name: string | required | Name of the tournament category (e.g., Men's Singles, Women's Doubles)
          - type: string | required | Type of tournament category | choices: single, team, double
          - maxEntries: integer | required | Maximum number of entries allowed
          - maxSets: integer | required | Maximum number of sets per match
          - teamFormat: string
          - minAge: integer | Minimum age requirement
          - maxAge: integer | Maximum age requirement
          - minElo: integer | Minimum ELO requirement
          - maxElo: integer | Maximum ELO requirement
          - maxMembersPerEntry: integer | Only applicable for team categories. Null means no upper limit.
          - gender: string | Gender requirement (male, female, or mixed) | choices: male, female, mixed
          - isGroupStage: boolean | Whether this category has a group stage
          - entryFee: number | default: 0
          - createdAt: string
          - updatedAt: string
          - numberOfSingles: integer | Number of singles matches (for team type)
          - numberOfDoubles: integer | Number of doubles matches (for team type)
      - createdAt: string
      - updatedAt: string
      - startDate: string | required | Tournament start date and time
      - endDate: string | Tournament end date and time (optional)
      - numberOfTables: integer | Number of tables available for concurrent matches | default: 1
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
  "tournaments": [
    {
      "id": 1,
      "name": "string",
      "introduction": "string",
      "tier": 1,
      "status": "upcoming",
      "location": "string",
      "createdBy": 1,
      "categories": [
        {
          "id": 1,
          "tournamentId": 1,
          "name": "string",
          "type": "single",
          "maxEntries": 1,
          "maxSets": 1,
          "teamFormat": "string",
          "minAge": 1,
          "maxAge": 1,
          "minElo": 1,
          "maxElo": 1,
          "maxMembersPerEntry": 1,
          "gender": "male",
          "isGroupStage": true,
          "entryFee": 0,
          "createdAt": "2026-05-27T00:00:00Z",
          "updatedAt": "2026-05-27T00:00:00Z",
          "numberOfSingles": 1,
          "numberOfDoubles": 1
        }
      ],
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z",
      "startDate": "2026-05-27T00:00:00Z",
      "endDate": "2026-05-27T00:00:00Z",
      "numberOfTables": 1
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 500
Internal server error

---

## GET /api/tournaments/search
Tag: Tournaments
Summary: Search tournaments with category filters and pagination

Get all tournaments with their categories filtered by various criteria including user participation, age, ELO, gender, and other category properties

Request parameters:
- offset (query) | type: integer | Number of records to offset for pagination | default: 0
- limit (query) | type: integer | Maximum number of records to return. Use 0 to get all tournaments without limit | default: 10
- userId (query) | type: integer | Filter tournaments where this user has entries
- createdBy (query) | type: integer | Filter tournaments created by this user
- minAge (query) | type: integer | Filter by minimum age requirement (category.minAge <= this value)
- maxAge (query) | type: integer | Filter by maximum age requirement (category.maxAge >= this value)
- minElo (query) | type: integer | Filter by minimum ELO requirement (category.minElo <= this value)
- maxElo (query) | type: integer | Filter by maximum ELO requirement (category.maxElo >= this value)
- gender (query) | type: string | Filter by gender category | choices: male, female, mixed
- isGroupStage (query) | type: boolean | Filter by group stage format

Request body:
None

Responses:
### 200
Description: Filtered list of tournaments with pagination
Type: object
Body:
  - tournaments: array
    - items: object
      - id: integer | Tournament ID
      - name: string | required | Tournament name
      - introduction: string | Tournament introduction
      - tier: integer | required | Tournament tier level
      - status: string | Current status of the tournament | choices: upcoming, ongoing, completed, brackets_generated, ongoing, completed, cancelled | default: "upcoming"
      - location: string | required | Tournament venue location
      - createdBy: integer | required | ID of the user who created this tournament
      - categories: array
        - items: object
          - id: integer | Category ID
          - tournamentId: integer | required | ID of the tournament this category belongs to
          - name: string | required | Name of the tournament category (e.g., Men's Singles, Women's Doubles)
          - type: string | required | Type of tournament category | choices: single, team, double
          - maxEntries: integer | required | Maximum number of entries allowed
          - maxSets: integer | required | Maximum number of sets per match
          - teamFormat: string
          - minAge: integer | Minimum age requirement
          - maxAge: integer | Maximum age requirement
          - minElo: integer | Minimum ELO requirement
          - maxElo: integer | Maximum ELO requirement
          - maxMembersPerEntry: integer | Only applicable for team categories. Null means no upper limit.
          - gender: string | Gender requirement (male, female, or mixed) | choices: male, female, mixed
          - isGroupStage: boolean | Whether this category has a group stage
          - entryFee: number | default: 0
          - createdAt: string
          - updatedAt: string
          - numberOfSingles: integer | Number of singles matches (for team type)
          - numberOfDoubles: integer | Number of doubles matches (for team type)
      - createdAt: string
      - updatedAt: string
      - startDate: string | required | Tournament start date and time
      - endDate: string | Tournament end date and time (optional)
      - numberOfTables: integer | Number of tables available for concurrent matches | default: 1
  - pagination: object
    - total: integer | Total number of tournaments matching the filters
    - page: integer | Current page number
    - limit: integer | Number of items per page
    - totalPages: integer | Total number of pages
    - hasNextPage: boolean | Whether there is a next page
    - hasPrevPage: boolean | Whether there is a previous page
Example response:
```json
{
  "tournaments": [
    {
      "id": 1,
      "name": "string",
      "introduction": "string",
      "tier": 1,
      "status": "upcoming",
      "location": "string",
      "createdBy": 1,
      "categories": [
        {
          "id": 1,
          "tournamentId": 1,
          "name": "string",
          "type": "single",
          "maxEntries": 1,
          "maxSets": 1,
          "teamFormat": "string",
          "minAge": 1,
          "maxAge": 1,
          "minElo": 1,
          "maxElo": 1,
          "maxMembersPerEntry": 1,
          "gender": "male",
          "isGroupStage": true,
          "entryFee": 0,
          "createdAt": "2026-05-27T00:00:00Z",
          "updatedAt": "2026-05-27T00:00:00Z",
          "numberOfSingles": 1,
          "numberOfDoubles": 1
        }
      ],
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z",
      "startDate": "2026-05-27T00:00:00Z",
      "endDate": "2026-05-27T00:00:00Z",
      "numberOfTables": 1
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 500
Internal server error

---

## POST /api/tournaments/update-statuses
Tag: Tournaments
Summary: Manually trigger tournament status updates

Manually update tournament statuses based on registration and bracket dates.
This endpoint is useful for admins to force status updates outside the cron schedule.
Status transitions:
- upcoming → registration_open (when registrationStartDate is reached)
- registration_open → registration_closed (when registrationEndDate is reached)
- registration_closed → brackets_generated (when bracketGenerationDate is reached)

Auth: bearerAuth

Request parameters:
None

Request body:
None

Responses:
### 200
Description: Status update completed successfully
Type: object
Body:
  - success: boolean
  - message: string
  - data: object
    - openedCount: integer | Number of tournaments that opened registration
    - closedCount: integer | Number of tournaments that closed registration
    - bracketsGeneratedCount: integer | Number of tournaments that generated brackets
    - totalUpdated: integer | Total number of tournaments updated
Example response:
```json
{
  "success": true,
  "message": "Tournament statuses updated successfully",
  "data": {
    "openedCount": 2,
    "closedCount": 1,
    "bracketsGeneratedCount": 0,
    "totalUpdated": 3
  }
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

### 500
Internal server error

---

## GET /api/tournaments/upcoming-changes
Tag: Tournaments
Summary: Get upcoming tournament status changes

Get a list of tournaments that will change status within the specified time period.
Useful for monitoring and preparing for upcoming tournament phases.

Auth: bearerAuth

Request parameters:
- hours (query) | type: integer | Number of hours to look ahead (default is 24 hours) | default: 24

Request body:
None

Responses:
### 200
Description: List of upcoming status changes
Type: object
Body:
  - success: boolean
  - data: object
    - openingSoon: array | Tournaments that will open registration soon
      - items: object
        - id: integer
        - name: string
        - status: string
        - scheduleConfig: object
          - registrationStartDate: string
    - closingSoon: array | Tournaments that will close registration soon
      - items: object
        - id: integer
        - name: string
        - status: string
        - scheduleConfig: object
          - registrationEndDate: string
    - bracketsSoon: array | Tournaments that will generate brackets soon
      - items: object
        - id: integer
        - name: string
        - status: string
        - scheduleConfig: object
          - bracketGenerationDate: string
  - metadata: object
    - lookAheadHours: integer
    - timestamp: string
Example response:
```json
{
  "success": true,
  "data": {
    "openingSoon": [
      {
        "id": 1,
        "name": "string",
        "status": "upcoming",
        "scheduleConfig": {
          "registrationStartDate": "2026-05-27T00:00:00Z"
        }
      }
    ],
    "closingSoon": [
      {
        "id": 1,
        "name": "string",
        "status": "registration_open",
        "scheduleConfig": {
          "registrationEndDate": "2026-05-27T00:00:00Z"
        }
      }
    ],
    "bracketsSoon": [
      {
        "id": 1,
        "name": "string",
        "status": "registration_closed",
        "scheduleConfig": {
          "bracketGenerationDate": "2026-05-27T00:00:00Z"
        }
      }
    ]
  },
  "metadata": {
    "lookAheadHours": 24,
    "timestamp": "2026-05-27T00:00:00Z"
  }
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

### 500
Internal server error

---

## GET /api/tournaments/organizer/my
Tag: Tournaments
Summary: Get tournaments organized by current user

Retrieve all tournaments created by the authenticated user with pagination and sorting support

Auth: bearerAuth

Request parameters:
- offset (query) | type: integer | Number of items to offset for pagination | default: 0
- limit (query) | type: integer | Number of items to return per page | default: 10
- sortBy (query) | type: string | Field to sort by | default: createdAt
- sortOrder (query) | type: string | Sort order (ASC or DESC) | choices: ASC, DESC | default: DESC

Request body:
None

Responses:
### 200
Description: List of tournaments created by user
Type: object
Body:
  - tournaments: array
    - items: object
      - id: integer | Tournament ID
      - name: string | required | Tournament name
      - introduction: string | Tournament introduction
      - tier: integer | required | Tournament tier level
      - status: string | Current status of the tournament | choices: upcoming, ongoing, completed, brackets_generated, ongoing, completed, cancelled | default: "upcoming"
      - location: string | required | Tournament venue location
      - createdBy: integer | required | ID of the user who created this tournament
      - categories: array
        - items: object
          - id: integer | Category ID
          - tournamentId: integer | required | ID of the tournament this category belongs to
          - name: string | required | Name of the tournament category (e.g., Men's Singles, Women's Doubles)
          - type: string | required | Type of tournament category | choices: single, team, double
          - maxEntries: integer | required | Maximum number of entries allowed
          - maxSets: integer | required | Maximum number of sets per match
          - teamFormat: string
          - minAge: integer | Minimum age requirement
          - maxAge: integer | Maximum age requirement
          - minElo: integer | Minimum ELO requirement
          - maxElo: integer | Maximum ELO requirement
          - maxMembersPerEntry: integer | Only applicable for team categories. Null means no upper limit.
          - gender: string | Gender requirement (male, female, or mixed) | choices: male, female, mixed
          - isGroupStage: boolean | Whether this category has a group stage
          - entryFee: number | default: 0
          - createdAt: string
          - updatedAt: string
          - numberOfSingles: integer | Number of singles matches (for team type)
          - numberOfDoubles: integer | Number of doubles matches (for team type)
      - createdAt: string
      - updatedAt: string
      - startDate: string | required | Tournament start date and time
      - endDate: string | Tournament end date and time (optional)
      - numberOfTables: integer | Number of tables available for concurrent matches | default: 1
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
  "tournaments": [
    {
      "id": 1,
      "name": "string",
      "introduction": "string",
      "tier": 1,
      "status": "upcoming",
      "location": "string",
      "createdBy": 1,
      "categories": [
        {
          "id": 1,
          "tournamentId": 1,
          "name": "string",
          "type": "single",
          "maxEntries": 1,
          "maxSets": 1,
          "teamFormat": "string",
          "minAge": 1,
          "maxAge": 1,
          "minElo": 1,
          "maxElo": 1,
          "maxMembersPerEntry": 1,
          "gender": "male",
          "isGroupStage": true,
          "entryFee": 0,
          "createdAt": "2026-05-27T00:00:00Z",
          "updatedAt": "2026-05-27T00:00:00Z",
          "numberOfSingles": 1,
          "numberOfDoubles": 1
        }
      ],
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z",
      "startDate": "2026-05-27T00:00:00Z",
      "endDate": "2026-05-27T00:00:00Z",
      "numberOfTables": 1
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
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

### 500
Internal server error

---

## GET /api/tournaments/referee/my
Tag: Tournaments
Summary: Get tournaments where user is a referee

Retrieve all tournaments where the authenticated user is assigned as a referee with pagination and sorting support

Auth: bearerAuth

Request parameters:
- offset (query) | type: integer | Number of items to offset for pagination | default: 0
- limit (query) | type: integer | Number of items to return per page | default: 10
- sortBy (query) | type: string | Field to sort by | default: createdAt
- sortOrder (query) | type: string | Sort order (ASC or DESC) | choices: ASC, DESC | default: DESC

Request body:
None

Responses:
### 200
Description: List of tournaments where user is a referee
Type: object
Body:
  - tournaments: array
    - items: object
      - id: integer | Tournament ID
      - name: string | required | Tournament name
      - introduction: string | Tournament introduction
      - tier: integer | required | Tournament tier level
      - status: string | Current status of the tournament | choices: upcoming, ongoing, completed, brackets_generated, ongoing, completed, cancelled | default: "upcoming"
      - location: string | required | Tournament venue location
      - createdBy: integer | required | ID of the user who created this tournament
      - categories: array
        - items: object
          - id: integer | Category ID
          - tournamentId: integer | required | ID of the tournament this category belongs to
          - name: string | required | Name of the tournament category (e.g., Men's Singles, Women's Doubles)
          - type: string | required | Type of tournament category | choices: single, team, double
          - maxEntries: integer | required | Maximum number of entries allowed
          - maxSets: integer | required | Maximum number of sets per match
          - teamFormat: string
          - minAge: integer | Minimum age requirement
          - maxAge: integer | Maximum age requirement
          - minElo: integer | Minimum ELO requirement
          - maxElo: integer | Maximum ELO requirement
          - maxMembersPerEntry: integer | Only applicable for team categories. Null means no upper limit.
          - gender: string | Gender requirement (male, female, or mixed) | choices: male, female, mixed
          - isGroupStage: boolean | Whether this category has a group stage
          - entryFee: number | default: 0
          - createdAt: string
          - updatedAt: string
          - numberOfSingles: integer | Number of singles matches (for team type)
          - numberOfDoubles: integer | Number of doubles matches (for team type)
      - createdAt: string
      - updatedAt: string
      - startDate: string | required | Tournament start date and time
      - endDate: string | Tournament end date and time (optional)
      - numberOfTables: integer | Number of tables available for concurrent matches | default: 1
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
  "tournaments": [
    {
      "id": 1,
      "name": "string",
      "introduction": "string",
      "tier": 1,
      "status": "upcoming",
      "location": "string",
      "createdBy": 1,
      "categories": [
        {
          "id": 1,
          "tournamentId": 1,
          "name": "string",
          "type": "single",
          "maxEntries": 1,
          "maxSets": 1,
          "teamFormat": "string",
          "minAge": 1,
          "maxAge": 1,
          "minElo": 1,
          "maxElo": 1,
          "maxMembersPerEntry": 1,
          "gender": "male",
          "isGroupStage": true,
          "entryFee": 0,
          "createdAt": "2026-05-27T00:00:00Z",
          "updatedAt": "2026-05-27T00:00:00Z",
          "numberOfSingles": 1,
          "numberOfDoubles": 1
        }
      ],
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z",
      "startDate": "2026-05-27T00:00:00Z",
      "endDate": "2026-05-27T00:00:00Z",
      "numberOfTables": 1
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
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

### 500
Internal server error

---

## GET /api/tournaments/{id}
Tag: Tournaments
Summary: Get tournament by ID with categories

Retrieve a tournament by ID including all tournament categories

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Description: Tournament details with categories
Type: object
Example response:
```json
{
  "id": 1,
  "name": "string",
  "introduction": "string",
  "tier": 1,
  "status": "upcoming",
  "location": "string",
  "createdBy": 1,
  "categories": [
    {
      "id": 1,
      "tournamentId": 1,
      "name": "string",
      "type": "single",
      "maxEntries": 1,
      "maxSets": 1,
      "teamFormat": "string",
      "minAge": 1,
      "maxAge": 1,
      "minElo": 1,
      "maxElo": 1,
      "maxMembersPerEntry": 1,
      "gender": "male",
      "isGroupStage": true,
      "entryFee": 0,
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z",
      "numberOfSingles": 1,
      "numberOfDoubles": 1
    }
  ],
  "createdAt": "2026-05-27T00:00:00Z",
  "updatedAt": "2026-05-27T00:00:00Z",
  "startDate": "2026-05-27T00:00:00Z",
  "endDate": "2026-05-27T00:00:00Z",
  "numberOfTables": 1
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

## PUT /api/tournaments/{id}
Tag: Tournaments
Summary: Update tournament with categories

Update a tournament and optionally replace its categories.

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
Required: yes
Type: object
Example payload:
```json
{
  "name": "string",
  "introduction": "string",
  "tier": 1,
  "location": "string",
  "status": "upcoming",
  "categories": [
    {
      "name": "string",
      "type": "single",
      "maxEntries": 1,
      "maxSets": 5,
      "teamFormat": "string",
      "minAge": 1,
      "maxAge": 1,
      "minElo": 1,
      "maxElo": 1,
      "maxMembersPerEntry": 1,
      "gender": "male",
      "isGroupStage": false
    }
  ]
}
```

Responses:
### 200
Description: Tournament updated successfully
Type: object
Example response:
```json
{
  "id": 1,
  "name": "string",
  "introduction": "string",
  "tier": 1,
  "status": "upcoming",
  "location": "string",
  "createdBy": 1,
  "categories": [
    {
      "id": 1,
      "tournamentId": 1,
      "name": "string",
      "type": "single",
      "maxEntries": 1,
      "maxSets": 1,
      "teamFormat": "string",
      "minAge": 1,
      "maxAge": 1,
      "minElo": 1,
      "maxElo": 1,
      "maxMembersPerEntry": 1,
      "gender": "male",
      "isGroupStage": true,
      "entryFee": 0,
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z",
      "numberOfSingles": 1,
      "numberOfDoubles": 1
    }
  ],
  "createdAt": "2026-05-27T00:00:00Z",
  "updatedAt": "2026-05-27T00:00:00Z",
  "startDate": "2026-05-27T00:00:00Z",
  "endDate": "2026-05-27T00:00:00Z",
  "numberOfTables": 1
}
```

### 400
Bad request

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
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

## DELETE /api/tournaments/{id}
Tag: Tournaments
Summary: Delete tournament

Delete a tournament by ID

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 204
Successfully deleted, no content returned

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
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
