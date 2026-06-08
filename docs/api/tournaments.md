# Tournaments

Tournament management endpoints

Total endpoints: 10

## POST /api/tournaments
Tag: Tournaments
Summary: Create a new tournament with categories

Create a tournament along with its tournament categories in a single transaction.

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - name: string | required | Name of the tournament
  - tier: integer | required | Tournament tier level (1-5)
  - location: string | required | Tournament venue location
  - status: string | Tournament status (default is 'upcoming') | choices: upcoming, registration_open, registration_closed, brackets_generated, ongoing, completed, cancelled
  - categories: array | Array of tournament categories
    - items: object
      - name: string | required | Name of the tournament category (e.g., Men's Singles, Women's Doubles)
      - type: string | required | Type of tournament category | choices: single, team, double
      - maxEntries: integer | required | Maximum number of entries allowed
      - maxSets: integer | required | Maximum number of sets per match
      - numberOfSingles: integer | Number of singles matches
      - numberOfDoubles: integer | Number of doubles matches
      - minAge: integer | Minimum age requirement
      - maxAge: integer | Maximum age requirement
      - minElo: integer | Minimum ELO rating requirement
      - maxElo: integer | Maximum ELO rating requirement
      - gender: string | Gender requirement for the tournament category | choices: male, female, mixed
      - isGroupStage: boolean | Whether this category has a group stage (optional)
Example payload:
```json
{
  "name": "Spring Championship 2026",
  "tier": 3,
  "location": "National Stadium",
  "status": "upcoming",
  "categories": [
    {
      "name": "Men's Singles",
      "type": "single",
      "maxEntries": 32,
      "maxSets": 3,
      "numberOfSingles": 3,
      "numberOfDoubles": 2,
      "minAge": 18,
      "maxAge": 65,
      "minElo": 1000,
      "maxElo": 2000,
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
Body:
  - id: integer
  - name: string
  - tier: integer
  - location: string
  - status: string
  - createdBy: integer | ID of the user who created this tournament
  - createdAt: string
  - updatedAt: string
  - categories: array
    - items: object
      - id: integer
      - tournamentId: integer
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
      - createdAt: string
      - updatedAt: string
Example response:
```json
{
  "id": 1,
  "name": "Spring Championship 2026",
  "tier": 3,
  "location": "National Stadium",
  "status": "upcoming",
  "createdBy": 5,
  "createdAt": "2026-02-10T14:30:00Z",
  "updatedAt": "2026-02-10T14:30:00Z",
  "categories": [
    {
      "id": 1,
      "tournamentId": 1,
      "name": "Men's Singles",
      "type": "single",
      "maxEntries": 32,
      "maxSets": 3,
      "numberOfSingles": 3,
      "numberOfDoubles": 0,
      "minAge": 18,
      "maxAge": 65,
      "minElo": 1000,
      "maxElo": 2500,
      "gender": "male",
      "isGroupStage": false,
      "createdAt": "2026-02-10T14:30:00Z",
      "updatedAt": "2026-02-10T14:30:00Z"
    }
  ]
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
Description: Unauthorized - User not authenticated
Type: object
Body:
  - message: string
Example response:
```json
{
  "message": "Unauthorized - User not authenticated"
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
      - id: integer
      - name: string
      - tier: integer
      - status: string | choices: upcoming, registration_open, registration_closed, brackets_generated, ongoing, completed, cancelled
      - location: string
      - createdBy: integer
      - createdAt: string
      - updatedAt: string
      - categories: array
        - items: object
          - id: integer
          - tournamentId: integer
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
  "tournaments": [
    {
      "id": 1,
      "name": "Spring Championship 2026",
      "tier": 3,
      "status": "upcoming",
      "location": "National Stadium",
      "createdBy": 5,
      "createdAt": "2026-02-10T14:30:00Z",
      "updatedAt": "2026-02-10T14:30:00Z",
      "categories": [
        {
          "id": 1,
          "tournamentId": 1,
          "name": "Men's Singles",
          "type": "single",
          "maxEntries": 32,
          "maxSets": 3,
          "numberOfSingles": 3,
          "numberOfDoubles": 0,
          "minAge": 18,
          "maxAge": 65,
          "minElo": 1000,
          "maxElo": 2500,
          "gender": "male",
          "isGroupStage": false,
          "createdAt": "2026-02-10T14:30:00Z",
          "updatedAt": "2026-02-10T14:30:00Z"
        }
      ]
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
      - id: integer
      - name: string
      - tier: integer
      - status: string | choices: upcoming, registration_open, registration_closed, brackets_generated, ongoing, completed, cancelled
      - startDate: string
      - endDate: string
      - registrationStartDate: string
      - registrationEndDate: string
      - bracketGenerationDate: string
      - location: string
      - numberOfTables: integer
      - createdBy: integer
      - createdAt: string
      - updatedAt: string
      - categories: array
        - items: object
          - id: integer
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
          - createdAt: string
          - updatedAt: string
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
      "name": "Spring Championship 2026",
      "tier": 3,
      "status": "upcoming",
      "startDate": "2026-03-15T09:00:00Z",
      "endDate": "2026-03-20T18:00:00Z",
      "registrationStartDate": "2026-02-15T00:00:00Z",
      "registrationEndDate": "2026-03-10T23:59:59Z",
      "bracketGenerationDate": "2026-03-12T10:00:00Z",
      "location": "National Stadium",
      "numberOfTables": 4,
      "createdBy": 5,
      "createdAt": "2026-02-10T14:30:00Z",
      "updatedAt": "2026-02-10T14:30:00Z",
      "categories": [
        {
          "id": 1,
          "name": "Men's Singles",
          "type": "single",
          "maxEntries": 32,
          "maxSets": 3,
          "numberOfSingles": 3,
          "numberOfDoubles": 0,
          "minAge": 18,
          "maxAge": 65,
          "minElo": 1000,
          "maxElo": 2500,
          "gender": "male",
          "isGroupStage": false,
          "createdAt": "2026-02-10T14:30:00Z",
          "updatedAt": "2026-02-10T14:30:00Z"
        }
      ]
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
        - registrationStartDate: string
        - status: string
    - closingSoon: array | Tournaments that will close registration soon
      - items: object
        - id: integer
        - name: string
        - registrationEndDate: string
        - status: string
    - bracketsSoon: array | Tournaments that will generate brackets soon
      - items: object
        - id: integer
        - name: string
        - bracketGenerationDate: string
        - status: string
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
        "registrationStartDate": "2026-05-27T00:00:00Z",
        "status": "upcoming"
      }
    ],
    "closingSoon": [
      {
        "id": 1,
        "name": "string",
        "registrationEndDate": "2026-05-27T00:00:00Z",
        "status": "registration_open"
      }
    ],
    "bracketsSoon": [
      {
        "id": 1,
        "name": "string",
        "bracketGenerationDate": "2026-05-27T00:00:00Z",
        "status": "registration_closed"
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
      - id: integer
      - name: string
      - tier: integer
      - status: string
      - location: string
      - createdBy: integer
      - createdAt: string
      - updatedAt: string
      - categories: array
        - items: object
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
      "name": "Spring Championship 2026",
      "tier": 3,
      "status": "upcoming",
      "location": "National Stadium",
      "createdBy": 5,
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z",
      "categories": [
        null
      ]
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
      - id: integer
      - name: string
      - tier: integer
      - status: string
      - location: string
      - createdBy: integer
      - createdAt: string
      - updatedAt: string
      - categories: array
        - items: object
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
      "name": "Spring Championship 2026",
      "tier": 3,
      "status": "ongoing",
      "location": "National Stadium",
      "createdBy": 5,
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z",
      "categories": [
        null
      ]
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
Body:
  - id: integer
  - name: string
  - tier: integer
  - status: string | choices: upcoming, registration_open, registration_closed, brackets_generated, ongoing, completed, cancelled
  - startDate: string
  - endDate: string
  - registrationStartDate: string
  - registrationEndDate: string
  - bracketGenerationDate: string
  - location: string
  - numberOfTables: integer
  - createdBy: integer
  - createdAt: string
  - updatedAt: string
  - categories: array
    - items: object
      - id: integer
      - tournamentId: integer
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
      - createdAt: string
      - updatedAt: string
Example response:
```json
{
  "id": 1,
  "name": "Spring Championship 2026",
  "tier": 3,
  "status": "upcoming",
  "startDate": "2026-03-15T09:00:00Z",
  "endDate": "2026-03-20T18:00:00Z",
  "registrationStartDate": "2026-02-15T00:00:00Z",
  "registrationEndDate": "2026-03-10T23:59:59Z",
  "bracketGenerationDate": "2026-03-12T10:00:00Z",
  "location": "National Stadium",
  "numberOfTables": 4,
  "createdBy": 5,
  "createdAt": "2026-02-10T14:30:00Z",
  "updatedAt": "2026-02-10T14:30:00Z",
  "categories": [
    {
      "id": 1,
      "tournamentId": 1,
      "name": "Men's Singles",
      "type": "single",
      "maxEntries": 32,
      "maxSets": 3,
      "numberOfSingles": 3,
      "numberOfDoubles": 0,
      "minAge": 18,
      "maxAge": 65,
      "minElo": 1000,
      "maxElo": 2500,
      "gender": "male",
      "isGroupStage": false,
      "createdAt": "2026-02-10T14:30:00Z",
      "updatedAt": "2026-02-10T14:30:00Z"
    }
  ]
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

Update a tournament and optionally its categories. If categories are provided, all existing categories will be replaced.

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
Required: yes
Type: object
Fields:
  - name: string
  - tier: integer
  - startDate: string
  - endDate: string
  - registrationStartDate: string | Registration opens at this date
  - registrationEndDate: string | Registration closes at this date (must be before startDate)
  - bracketGenerationDate: string | Date when brackets are generated (must be at least 2 days before startDate)
  - location: string
  - status: string | choices: upcoming, registration_open, registration_closed, brackets_generated, ongoing, completed, cancelled
  - numberOfTables: integer | Number of tables available for concurrent matches
  - categories: array | Array of tournament categories (optional). If provided, replaces all existing categories.
    - items: object
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
  "name": "Spring Championship 2026 - Updated",
  "tier": 3,
  "startDate": "2026-03-15T09:00:00Z",
  "endDate": "2026-03-20T18:00:00Z",
  "registrationStartDate": "2026-02-15T00:00:00Z",
  "registrationEndDate": "2026-03-10T23:59:59Z",
  "bracketGenerationDate": "2026-03-12T10:00:00Z",
  "location": "National Stadium",
  "status": "ongoing",
  "numberOfTables": 6,
  "categories": [
    {
      "name": "Men's Singles",
      "type": "single",
      "maxEntries": 32,
      "maxSets": 3,
      "numberOfSingles": 3,
      "numberOfDoubles": 2,
      "minAge": 18,
      "maxAge": 65,
      "minElo": 1000,
      "maxElo": 2500,
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
  "tier": 1,
  "status": "upcoming",
  "startDate": "2026-05-27T00:00:00Z",
  "endDate": "2026-05-27T00:00:00Z",
  "registrationStartDate": "2026-05-27T00:00:00Z",
  "registrationEndDate": "2026-05-27T00:00:00Z",
  "bracketGenerationDate": "2026-05-27T00:00:00Z",
  "location": "string",
  "numberOfTables": 1,
  "createdBy": 1,
  "createdAt": "2026-05-27T00:00:00Z",
  "updatedAt": "2026-05-27T00:00:00Z"
}
```

### 400
Bad request

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

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 204
Successfully deleted, no content returned

---
