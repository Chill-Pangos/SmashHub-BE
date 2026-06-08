# Schedule Config

Schedule configuration endpoints

Total endpoints: 8

## POST /api/schedule-configs
Tag: Schedule Config
Summary: Create a new schedule config

Create a schedule configuration for a tournament

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - tournamentId: integer | required | Tournament ID
  - startDate: string | required | Tournament start date and time
  - endDate: string | required | Tournament end date and time
  - numberOfTables: integer | Number of tables available for matches
  - registrationStartDate: string | required | Start date for player registration
  - registrationEndDate: string | required | End date for player registration
  - bracketGenerationDate: string | required | Date when brackets will be generated
  - matchDurationMinutes: integer | Duration of each match in minutes
  - breakDurationMinutes: integer | Break duration between matches in minutes
  - dailyStartHour: integer | Tournament daily start hour (24-hour format)
  - dailyStartMinute: integer | Tournament daily start minute
  - dailyEndHour: integer | Tournament daily end hour (24-hour format)
  - dailyEndMinute: integer | Tournament daily end minute
  - lunchBreakStartHour: integer | Lunch break start hour (24-hour format)
  - lunchBreakStartMinute: integer | Lunch break start minute
  - lunchBreakEndHour: integer | Lunch break end hour (24-hour format)
  - lunchBreakEndMinute: integer | Lunch break end minute
  - lunchBreakDurationMinutes: integer | Duration of lunch break in minutes
  - notes: string | Additional notes about the schedule
Example payload:
```json
{
  "tournamentId": 1,
  "startDate": "2026-05-27T00:00:00Z",
  "endDate": "2026-05-27T00:00:00Z",
  "numberOfTables": 1,
  "registrationStartDate": "2026-05-27T00:00:00Z",
  "registrationEndDate": "2026-05-27T00:00:00Z",
  "bracketGenerationDate": "2026-05-27T00:00:00Z",
  "matchDurationMinutes": 1,
  "breakDurationMinutes": 1,
  "dailyStartHour": 1,
  "dailyStartMinute": 1,
  "dailyEndHour": 1,
  "dailyEndMinute": 1,
  "lunchBreakStartHour": 1,
  "lunchBreakStartMinute": 1,
  "lunchBreakEndHour": 1,
  "lunchBreakEndMinute": 1,
  "lunchBreakDurationMinutes": 1,
  "notes": "string"
}
```

Responses:
### 201
Description: Schedule config created successfully
Type: object
Example response:
```json
{
  "id": 1,
  "tournamentId": 1,
  "matchDurationMinutes": 60,
  "breakDurationMinutes": 10,
  "dailyStartHour": 8,
  "dailyStartMinute": 0,
  "dailyEndHour": 22,
  "dailyEndMinute": 0,
  "lunchBreakStartHour": null,
  "lunchBreakStartMinute": 0,
  "lunchBreakEndHour": null,
  "lunchBreakEndMinute": 0,
  "lunchBreakDurationMinutes": null,
  "notes": null,
  "createdAt": "2026-05-27T00:00:00Z",
  "updatedAt": "2026-05-27T00:00:00Z"
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

## GET /api/schedule-configs/defaults
Tag: Schedule Config
Summary: Get default schedule config

Request parameters:
None

Request body:
None

Responses:
### 200
Default config values

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

## GET /api/tournaments/{tournamentId}/schedule-config
Tag: Schedule Config
Summary: Get schedule config

Request parameters:
- tournamentId (path) | type: integer | required

Request body:
None

Responses:
### 200
Description: Schedule config
Type: object
Example response:
```json
{
  "id": 1,
  "tournamentId": 1,
  "matchDurationMinutes": 60,
  "breakDurationMinutes": 10,
  "dailyStartHour": 8,
  "dailyStartMinute": 0,
  "dailyEndHour": 22,
  "dailyEndMinute": 0,
  "lunchBreakStartHour": null,
  "lunchBreakStartMinute": 0,
  "lunchBreakEndHour": null,
  "lunchBreakEndMinute": 0,
  "lunchBreakDurationMinutes": null,
  "notes": null,
  "createdAt": "2026-05-27T00:00:00Z",
  "updatedAt": "2026-05-27T00:00:00Z"
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

## PATCH /api/tournaments/{tournamentId}/schedule-config
Tag: Schedule Config
Summary: Update schedule config

Auth: bearerAuth

Request parameters:
- tournamentId (path) | type: integer | required

Request body:
Required: yes
Type: object

Responses:
### 200
Description: Updated
Type: object
Example response:
```json
{
  "id": 1,
  "tournamentId": 1,
  "matchDurationMinutes": 60,
  "breakDurationMinutes": 10,
  "dailyStartHour": 8,
  "dailyStartMinute": 0,
  "dailyEndHour": 22,
  "dailyEndMinute": 0,
  "lunchBreakStartHour": null,
  "lunchBreakStartMinute": 0,
  "lunchBreakEndHour": null,
  "lunchBreakEndMinute": 0,
  "lunchBreakDurationMinutes": null,
  "notes": null,
  "createdAt": "2026-05-27T00:00:00Z",
  "updatedAt": "2026-05-27T00:00:00Z"
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

## DELETE /api/tournaments/{tournamentId}/schedule-config
Tag: Schedule Config
Summary: Delete schedule config

Auth: bearerAuth

Request parameters:
- tournamentId (path) | type: integer | required

Request body:
None

Responses:
### 204
Deleted

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

## POST /api/tournaments/{tournamentId}/schedule-config/validate
Tag: Schedule Config
Summary: Validate schedule config

Auth: bearerAuth

Request parameters:
- tournamentId (path) | type: integer | required

Request body:
Required: yes
Type: object
Fields:
  - totalMatches: integer | required
Example payload:
```json
{
  "totalMatches": 1
}
```

Responses:
### 200
Description: Validation result
Type: object
Example response:
```json
{
  "isValid": true,
  "message": "string",
  "details": {
    "totalMatches": 1,
    "totalSlots": 1,
    "lastMatchEndTime": "2026-05-27T00:00:00Z",
    "tournamentEndTime": "2026-05-27T00:00:00Z",
    "overflowMinutes": 1
  },
  "suggestions": [
    {
      "type": "increase_tables",
      "description": "string",
      "impact": {
        "matchDurationMinutes": 1,
        "breakDurationMinutes": 1,
        "numberOfTables": 1,
        "newEndDate": "2026-05-27T00:00:00Z"
      },
      "priority": "high"
    }
  ]
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

## POST /api/tournaments/{tournamentId}/schedule-config/preview-create
Tag: Schedule Config
Summary: Preview creating a new schedule config

Preview the schedule configuration without saving it. Useful for client-side validation before confirming creation.

Auth: bearerAuth

Request parameters:
- tournamentId (path) | type: integer | required

Request body:
Required: yes
Type: object
Fields:
  - totalMatches: integer | required
  - startDate: string | required
  - endDate: string | required
  - registrationStartDate: string | required
  - registrationEndDate: string | required
  - bracketGenerationDate: string | required
  - numberOfTables: integer
  - matchDurationMinutes: integer
  - breakDurationMinutes: integer
  - dailyStartHour: integer
  - dailyStartMinute: integer
  - dailyEndHour: integer
  - dailyEndMinute: integer
Example payload:
```json
{
  "totalMatches": 1,
  "startDate": "2026-05-27T00:00:00Z",
  "endDate": "2026-05-27T00:00:00Z",
  "registrationStartDate": "2026-05-27T00:00:00Z",
  "registrationEndDate": "2026-05-27T00:00:00Z",
  "bracketGenerationDate": "2026-05-27T00:00:00Z",
  "numberOfTables": 1,
  "matchDurationMinutes": 1,
  "breakDurationMinutes": 1,
  "dailyStartHour": 1,
  "dailyStartMinute": 1,
  "dailyEndHour": 1,
  "dailyEndMinute": 1
}
```

Responses:
### 200
Description: Preview of schedule config creation
Type: object
Example response:
```json
{
  "isValid": true,
  "message": "string",
  "preview": {
    "totalMatches": 1,
    "totalSlots": 1,
    "estimatedEndTime": "2026-05-27T00:00:00Z",
    "tournamentEndTime": "2026-05-27T00:00:00Z",
    "availableMinutes": 1,
    "neededMinutes": 1,
    "overflowMinutes": 1,
    "startDate": "2026-05-27T00:00:00Z",
    "endDate": "2026-05-27T00:00:00Z",
    "registrationStartDate": "2026-05-27T00:00:00Z",
    "registrationEndDate": "2026-05-27T00:00:00Z",
    "bracketGenerationDate": "2026-05-27T00:00:00Z",
    "numberOfTables": 1,
    "matchDurationMinutes": 1,
    "breakDurationMinutes": 1
  }
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

## POST /api/tournaments/{tournamentId}/schedule-config/preview-update
Tag: Schedule Config
Summary: Preview updating a schedule config

Preview the updated schedule configuration without saving it. Useful for client-side validation before confirming update.

Auth: bearerAuth

Request parameters:
- tournamentId (path) | type: integer | required

Request body:
Required: yes
Type: object
Fields:
  - totalMatches: integer | required
  - startDate: string
  - endDate: string
  - registrationStartDate: string
  - registrationEndDate: string
  - bracketGenerationDate: string
  - numberOfTables: integer
  - matchDurationMinutes: integer
  - breakDurationMinutes: integer
  - dailyStartHour: integer
  - dailyStartMinute: integer
  - dailyEndHour: integer
  - dailyEndMinute: integer
Example payload:
```json
{
  "totalMatches": 1,
  "startDate": "2026-05-27T00:00:00Z",
  "endDate": "2026-05-27T00:00:00Z",
  "registrationStartDate": "2026-05-27T00:00:00Z",
  "registrationEndDate": "2026-05-27T00:00:00Z",
  "bracketGenerationDate": "2026-05-27T00:00:00Z",
  "numberOfTables": 1,
  "matchDurationMinutes": 1,
  "breakDurationMinutes": 1,
  "dailyStartHour": 1,
  "dailyStartMinute": 1,
  "dailyEndHour": 1,
  "dailyEndMinute": 1
}
```

Responses:
### 200
Description: Preview of schedule config update
Type: object
Example response:
```json
{
  "isValid": true,
  "message": "string",
  "preview": {
    "totalMatches": 1,
    "totalSlots": 1,
    "estimatedEndTime": "2026-05-27T00:00:00Z",
    "tournamentEndTime": "2026-05-27T00:00:00Z",
    "availableMinutes": 1,
    "neededMinutes": 1,
    "overflowMinutes": 1,
    "startDate": "2026-05-27T00:00:00Z",
    "endDate": "2026-05-27T00:00:00Z",
    "registrationStartDate": "2026-05-27T00:00:00Z",
    "registrationEndDate": "2026-05-27T00:00:00Z",
    "bracketGenerationDate": "2026-05-27T00:00:00Z",
    "numberOfTables": 1,
    "matchDurationMinutes": 1,
    "breakDurationMinutes": 1
  }
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
