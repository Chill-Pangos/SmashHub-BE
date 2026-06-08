# Schedule Config

Schedule configuration endpoints

Total endpoints: 8

## POST /api/schedule-configs
Tag: Schedule Config
Summary: Create a new schedule configuration

Create a schedule configuration for a tournament. The configuration defines:
- Tournament execution dates and time windows
- Registration and bracket generation schedules
- Match and break durations
- Daily operational hours with optional lunch breaks

**Time Slot Calculations:**
- Available time = (Tournament end - start) × daily operating hours
- Lunch break time is subtracted from available time
- Total slots needed = ceil(total matches / number of tables)
- Time needed = total slots × (match duration + break duration)

**Validation Rules:**
- Match duration: 30-90 minutes (default 60)
- Break duration: 5-30 minutes (default 10)
- Daily hours: 0-23 (must have dailyEndHour > dailyStartHour)
- Daily minutes: 0-59
- Number of tables: minimum 1
- Registration must close before tournament starts
- Bracket generation must be at least 2 days before tournament start
- Lunch break (if specified) must be within daily operating hours
- Lunch break cannot overlap daily hours boundary

**Schedule Fit Analysis:**
After creation, verify the schedule can accommodate all matches using the
validate endpoint (POST /schedule-configs/{tournamentId}/validate)

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - startDate: string | required | Tournament start date and time (cannot be in the past, ISO 8601 format)
  - endDate: string | required | Tournament end date and time (must be after startDate, ISO 8601 format)
  - registrationStartDate: string | required | Registration opening date (cannot be in the past, ISO 8601 format)
  - registrationEndDate: string | required | Registration closing date (must be before tournament starts)
  - bracketGenerationDate: string | required | Bracket generation date (must be after registration ends and at least 2 days before start)
  - numberOfTables: integer | Number of tournament tables for parallel matches. More tables = faster completion | default: 1
  - matchDurationMinutes: integer | Duration of each match in minutes (30-90, typically 45-60 for competitive play) | default: 60
  - breakDurationMinutes: integer | Break duration between matches in minutes (5-30, for table/player setup and rest) | default: 10
  - dailyStartHour: integer | Tournament daily start hour in 24-hour format (0=midnight, 8=8:00 AM) | default: 8
  - dailyStartMinute: integer | Tournament daily start minute (0-59) | default: 0
  - dailyEndHour: integer | Tournament daily end hour in 24-hour format (must be after start hour, 22=10:00 PM) | default: 22
  - dailyEndMinute: integer | Tournament daily end minute (0-59) | default: 0
  - lunchBreakStartHour: integer | Lunch break start hour (optional, must be within daily operating hours). Set to null to disable lunch break
  - lunchBreakStartMinute: integer | Lunch break start minute (optional, 0-59) | default: 0
  - lunchBreakEndHour: integer | Lunch break end hour (optional, must be after start hour if specified)
  - lunchBreakEndMinute: integer | Lunch break end minute (optional, 0-59) | default: 0
  - notes: string | Additional notes or special instructions for schedule management
Example payload:
```json
{
  "startDate": "2026-06-15T08:00:00Z",
  "endDate": "2026-06-20T22:00:00Z",
  "registrationStartDate": "2026-05-15T00:00:00Z",
  "registrationEndDate": "2026-06-14T23:59:59Z",
  "bracketGenerationDate": "2026-06-13T00:00:00Z",
  "numberOfTables": 4,
  "matchDurationMinutes": 60,
  "breakDurationMinutes": 10,
  "dailyStartHour": 8,
  "dailyStartMinute": 0,
  "dailyEndHour": 22,
  "dailyEndMinute": 0,
  "lunchBreakStartHour": 12,
  "lunchBreakStartMinute": 0,
  "lunchBreakEndHour": 13,
  "lunchBreakEndMinute": 0,
  "notes": "Main tournament at Convention Center. Use gymnasium for additional tables if needed."
}
```

Responses:
### 201
Description: Schedule configuration created successfully
Type: object
Example response:
```json
{
  "id": 1,
  "tournamentId": 1,
  "startDate": "2026-06-15T08:00:00Z",
  "endDate": "2026-06-20T22:00:00Z",
  "registrationStartDate": "2026-05-15T00:00:00Z",
  "registrationEndDate": "2026-06-14T23:59:59Z",
  "bracketGenerationDate": "2026-06-13T00:00:00Z",
  "numberOfTables": 4,
  "matchDurationMinutes": 60,
  "breakDurationMinutes": 10,
  "dailyStartHour": 8,
  "dailyStartMinute": 0,
  "dailyEndHour": 22,
  "dailyEndMinute": 0,
  "lunchBreakStartHour": 12,
  "lunchBreakStartMinute": 0,
  "lunchBreakEndHour": 13,
  "lunchBreakEndMinute": 0,
  "notes": "Main venue tournament",
  "createdAt": "2026-05-28T10:00:00Z",
  "updatedAt": "2026-05-28T10:00:00Z"
}
```

### 400
Description: Validation error (invalid dates, time ranges, overlapping lunch break, or configuration)
Type: object
Example response:
```json
{
  "message": "string"
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

## GET /api/schedule-configs/defaults
Tag: Schedule Config
Summary: Get default schedule configuration values

Retrieve the default values for schedule configuration. These values can be used
to pre-populate the schedule creation form on the client side, providing reasonable
baseline values for most tournament scenarios.

**Default Values (Standard Tournament):**
- Match duration: 60 minutes (typical competitive match)
- Break duration: 10 minutes (for table/player setup and rest)
- Daily start: 08:00 (8 AM)
- Daily end: 22:00 (10 PM)
- Number of tables: 1 (single-table tournament)

**Use Case:**
Use these defaults to populate form fields in the client UI. Users can then
adjust these values based on their tournament needs. For aggressive schedules,
consider reducing match duration to 45 min or increasing table count.

Request parameters:
None

Request body:
None

Responses:
### 200
Description: Default configuration values retrieved successfully
Type: object
Body:
  - matchDurationMinutes: integer | required | Default match duration in minutes (30-90 allowed)
  - breakDurationMinutes: integer | required | Default break duration in minutes (5-30 allowed)
  - dailyStartHour: integer | required | Default daily start hour (24-hour format)
  - dailyStartMinute: integer | required | Default daily start minute
  - dailyEndHour: integer | required | Default daily end hour (24-hour format)
  - dailyEndMinute: integer | required | Default daily end minute
  - numberOfTables: integer | required | Default number of tournament tables
Example response:
```json
{
  "matchDurationMinutes": 60,
  "breakDurationMinutes": 10,
  "dailyStartHour": 8,
  "dailyStartMinute": 0,
  "dailyEndHour": 22,
  "dailyEndMinute": 0,
  "numberOfTables": 1
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

## GET /api/schedule-configs/tournament/{tournamentId}
Tag: Schedule Config
Summary: Get schedule configuration for a tournament

Retrieve the schedule configuration for a specific tournament.
Returns all configuration details including dates, time windows, and optional lunch breaks.

Request parameters:
- tournamentId (path) | type: integer | required | Tournament ID

Request body:
None

Responses:
### 200
Description: Schedule configuration retrieved successfully
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

## PATCH /api/schedule-configs/tournament/{tournamentId}
Tag: Schedule Config
Summary: Update schedule configuration

Update an existing schedule configuration for a tournament.
Only specified fields will be updated, others retain current values.

**Update Rules:**
- All datetime updates are validated against existing tournament dates
- Lunch break can be added, modified, or removed
- All time and date constraints are enforced (see POST /schedule-configs for rules)

Auth: bearerAuth

Request parameters:
- tournamentId (path) | type: integer | required | Tournament ID

Request body:
Required: yes
Type: object
Fields:
  - startDate: string | Tournament start date and time
  - endDate: string | Tournament end date and time
  - registrationStartDate: string | Registration opening date
  - registrationEndDate: string | Registration closing date
  - bracketGenerationDate: string | Bracket generation date
  - numberOfTables: integer | Number of tournament tables
  - matchDurationMinutes: integer | Match duration in minutes
  - breakDurationMinutes: integer | Break duration between matches in minutes
  - dailyStartHour: integer | Daily start hour
  - dailyStartMinute: integer | Daily start minute
  - dailyEndHour: integer | Daily end hour
  - dailyEndMinute: integer | Daily end minute
  - lunchBreakStartHour: integer | Lunch break start hour (null to remove)
  - lunchBreakStartMinute: integer | Lunch break start minute
  - lunchBreakEndHour: integer | Lunch break end hour
  - lunchBreakEndMinute: integer | Lunch break end minute
  - notes: string | Additional notes
Example payload:
```json
{
  "startDate": "2026-06-15T08:00:00Z",
  "endDate": "2026-06-20T22:00:00Z",
  "registrationStartDate": "2026-05-27T00:00:00Z",
  "registrationEndDate": "2026-05-27T00:00:00Z",
  "bracketGenerationDate": "2026-05-27T00:00:00Z",
  "numberOfTables": 4,
  "matchDurationMinutes": 60,
  "breakDurationMinutes": 10,
  "dailyStartHour": 1,
  "dailyStartMinute": 1,
  "dailyEndHour": 1,
  "dailyEndMinute": 1,
  "lunchBreakStartHour": 1,
  "lunchBreakStartMinute": 1,
  "lunchBreakEndHour": 1,
  "lunchBreakEndMinute": 1,
  "notes": "string"
}
```

Responses:
### 200
Description: Schedule configuration updated successfully
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

## DELETE /api/schedule-configs/tournament/{tournamentId}
Tag: Schedule Config
Summary: Delete schedule configuration

Delete the schedule configuration for a tournament.
This operation is permanent and cannot be undone.

**Note:** The associated tournament and its data remain unchanged;
only the schedule configuration is removed.

Auth: bearerAuth

Request parameters:
- tournamentId (path) | type: integer | required | Tournament ID

Request body:
None

Responses:
### 204
Schedule configuration deleted successfully (no content)

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

## POST /api/schedule-configs/tournament/{tournamentId}/validate
Tag: Schedule Config
Summary: Validate schedule configuration

Validate the current schedule configuration against a specific number of matches.
This endpoint checks if the configured schedule (tables, durations, daily hours) can
accommodate all matches within the tournament timeframe.

**Validation Checks:**
- Available time = (end date - start date) × daily operating hours
- Total slots needed = ceil(totalMatches / numberOfTables)
- Time needed = totalSlots × (matchDuration + breakDuration)
- Valid if: timeNeeded <= availableTime

Auth: bearerAuth

Request parameters:
- tournamentId (path) | type: integer | required | Tournament ID

Request body:
Required: yes
Type: object
Fields:
  - totalMatches: integer | required | Total number of matches to schedule (calculated from tournament categories)
Example payload:
```json
{
  "totalMatches": 127
}
```

Responses:
### 200
Description: Validation result with schedule fit analysis
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

## POST /api/schedule-configs/tournament/{tournamentId}/preview-create
Tag: Schedule Config
Summary: Preview schedule configuration before creation

Preview a new schedule configuration WITHOUT saving to database.
This endpoint validates the proposed configuration and calculates scheduling metrics
to help determine if it can accommodate all matches.

**Preview Calculations:**
- Available time windows within tournament dates
- Total match slots needed
- Estimated completion time
- Time buffer or overflow if applicable

**Use Case:** Client-side validation before user confirms schedule creation.
The client can show match fit analysis and ask for confirmation before saving.

Auth: bearerAuth

Request parameters:
- tournamentId (path) | type: integer | required | Tournament ID

Request body:
Required: yes
Type: object
Fields:
  - totalMatches: integer | required | Total number of matches (required for preview calculation)
  - startDate: string | required
  - endDate: string | required
  - registrationStartDate: string | required
  - registrationEndDate: string | required
  - bracketGenerationDate: string | required
  - numberOfTables: integer | default: 1
  - matchDurationMinutes: integer | default: 60
  - breakDurationMinutes: integer | default: 10
  - dailyStartHour: integer | default: 8
  - dailyStartMinute: integer | default: 0
  - dailyEndHour: integer | default: 22
  - dailyEndMinute: integer | default: 0
  - lunchBreakStartHour: integer
  - lunchBreakStartMinute: integer
  - lunchBreakEndHour: integer
  - lunchBreakEndMinute: integer
Example payload:
```json
{
  "totalMatches": 127,
  "startDate": "2026-06-15T08:00:00Z",
  "endDate": "2026-06-20T22:00:00Z",
  "registrationStartDate": "2026-05-27T00:00:00Z",
  "registrationEndDate": "2026-05-27T00:00:00Z",
  "bracketGenerationDate": "2026-05-27T00:00:00Z",
  "numberOfTables": 4,
  "matchDurationMinutes": 60,
  "breakDurationMinutes": 10,
  "dailyStartHour": 8,
  "dailyStartMinute": 0,
  "dailyEndHour": 22,
  "dailyEndMinute": 0,
  "lunchBreakStartHour": 1,
  "lunchBreakStartMinute": 1,
  "lunchBreakEndHour": 1,
  "lunchBreakEndMinute": 1
}
```

Responses:
### 200
Description: Schedule preview with fit analysis
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

## POST /api/schedule-configs/tournament/{tournamentId}/preview-update
Tag: Schedule Config
Summary: Preview schedule configuration update

Preview updates to an existing schedule configuration WITHOUT saving changes to database.
This endpoint merges the proposed changes with current configuration and validates the result.

**Behavior:**
- Merges provided fields with current configuration
- Calculates impact on match scheduling
- Returns updated metrics without persisting to database

**Use Case:** Allow users to experiment with configuration changes and see impact
before confirming the update.

Auth: bearerAuth

Request parameters:
- tournamentId (path) | type: integer | required | Tournament ID

Request body:
Required: yes
Type: object
Fields:
  - totalMatches: integer | required | Total number of matches (required for preview calculation)
  - startDate: string | Updated start date (optional)
  - endDate: string | Updated end date (optional)
  - registrationStartDate: string
  - registrationEndDate: string
  - bracketGenerationDate: string
  - numberOfTables: integer | Updated table count (optional)
  - matchDurationMinutes: integer | Updated match duration (optional)
  - breakDurationMinutes: integer | Updated break duration (optional)
  - dailyStartHour: integer
  - dailyStartMinute: integer
  - dailyEndHour: integer
  - dailyEndMinute: integer
  - lunchBreakStartHour: integer
  - lunchBreakStartMinute: integer
  - lunchBreakEndHour: integer
  - lunchBreakEndMinute: integer
Example payload:
```json
{
  "totalMatches": 127,
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
  "dailyEndMinute": 1,
  "lunchBreakStartHour": 1,
  "lunchBreakStartMinute": 1,
  "lunchBreakEndHour": 1,
  "lunchBreakEndMinute": 1
}
```

Responses:
### 200
Description: Updated schedule preview with fit analysis
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
