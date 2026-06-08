# Schedules

Schedule management endpoints

Total endpoints: 8

## POST /api/schedules/generate-tournament
Tag: Schedules
Summary: Generate full tournament schedule (group + knockout)

Tạo lịch toàn bộ tournament theo thứ tự: xong hết category này mới đến category khác.
Trong mỗi category: group stage trước, knockout sau (kể cả TBD placeholders).
Slot time được tính liên tục theo scheduleConfig của tournament.
tableNumber KHÔNG được gán ở đây — sẽ gán động khi trận bắt đầu.

Yêu cầu:
- scheduleConfig đã được tạo cho tournament
- groupStandings đã có (nếu category có vòng bảng)
- knockoutBrackets đã được generate (generatePlaceholders hoặc generateFromEntries)

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - tournamentId: integer | required
Example payload:
```json
{
  "tournamentId": 1
}
```

Responses:
### 201
Description: Tournament schedule generated successfully
Type: object
Body:
  - success: boolean
  - message: string
  - warnings: array | Overflow warnings nếu lịch vượt quá thời gian cho phép
    - items: string
  - data: array
    - items: object
      - categoryId: integer
      - totalSchedules: integer
      - totalMatches: integer
Example response:
```json
{
  "success": true,
  "message": "string",
  "warnings": [
    "string"
  ],
  "data": [
    {
      "categoryId": 1,
      "totalSchedules": 1,
      "totalMatches": 1
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

## POST /api/schedules/generate-group-stage
Tag: Schedules
Summary: Generate group stage schedule for a category

Tạo lịch vòng bảng (round-robin) cho 1 category dựa trên groupStandings.
Slot time tính từ scheduleConfig của tournament.
tableNumber KHÔNG được gán — sẽ gán động khi trận bắt đầu.

Yêu cầu:
- scheduleConfig đã được tạo
- groupStandings đã có (saveGroupAssignments đã chạy)

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
### 201
Description: Group stage schedule generated successfully
Type: object
Body:
  - success: boolean
  - message: string
  - warning: string | Có nếu lịch vượt quá thời gian cho phép
  - data: object
    - totalSchedules: integer
    - totalMatches: integer
    - schedules: array
      - items: object
        - id: integer
        - categoryId: integer | required
        - roundNumber: integer
        - groupName: string
        - stage: string | choices: group, knockout | default: "group"
        - knockoutRound: string
        - tableNumber: integer
        - scheduledAt: string | required
        - createdAt: string
        - updatedAt: string
    - matches: array
      - items: object
        - id: integer | Match ID
        - scheduleId: integer | required | ID of the schedule this match belongs to
        - entryAId: integer | required | ID of entry A (first competitor)
        - entryBId: integer | required | ID of entry B (second competitor)
        - status: string | required | Current status of the match | choices: scheduled, in_progress, completed, cancelled | default: "scheduled"
        - winnerEntryId: integer | ID of the winning entry
        - resultStatus: string | Match result approval status | choices: pending, approved, rejected
        - reviewNotes: string | Review notes from chief referee
        - schedule: object
        - entryA: object
        - entryB: object
        - winnerEntry: object
        - subMatches: array
          - items: object
            - id: integer | Unique identifier
            - matchId: integer | required | Parent match ID
            - subMatchNumber: integer | required
            - status: string | required | Current status of the sub-match | choices: scheduled, in_progress, completed | default: "scheduled"
            - winnerTeam: string | Winning team (A or B) | choices: A, B
            - umpireId: integer | Referee ID assigned as umpire
            - assistantUmpireId: integer | Optional assistant umpire ID
            - matchSets: array
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
            - subMatchPlayers: array
              - items: object
                - id: integer | Unique identifier
                - subMatchId: integer | required | Sub-match ID
                - entryMemberId: integer | required | Entry member ID (player)
                - team: string | required | Team assignment | choices: A, B
                - entryMember: object
                - createdAt: string
                - updatedAt: string
            - createdAt: string
            - updatedAt: string
        - matchReferees: array
          - items: object
            - id: integer
            - matchId: integer | required
            - refereeId: integer | required
            - referee: object
            - createdAt: string
            - updatedAt: string
        - createdAt: string
        - updatedAt: string
        - umpire: integer | ID of the umpire
        - assistantUmpire: integer | ID of the assistant umpire
Example response:
```json
{
  "success": true,
  "message": "string",
  "warning": "string",
  "data": {
    "totalSchedules": 1,
    "totalMatches": 1,
    "schedules": [
      {
        "id": 1,
        "categoryId": 1,
        "roundNumber": 1,
        "groupName": "string",
        "stage": "group",
        "knockoutRound": "string",
        "tableNumber": 1,
        "scheduledAt": "2026-05-27T00:00:00Z",
        "createdAt": "2026-05-27T00:00:00Z",
        "updatedAt": "2026-05-27T00:00:00Z"
      }
    ],
    "matches": [
      {
        "id": 1,
        "scheduleId": 1,
        "entryAId": 1,
        "entryBId": 1,
        "status": "scheduled",
        "winnerEntryId": 1,
        "resultStatus": "pending",
        "reviewNotes": "string",
        "schedule": null,
        "entryA": null,
        "entryB": null,
        "winnerEntry": null,
        "subMatches": [
          {
            "id": 1,
            "matchId": 1,
            "subMatchNumber": 1,
            "status": "scheduled",
            "winnerTeam": "A",
            "umpireId": 1,
            "assistantUmpireId": 1,
            "matchSets": [
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
            "subMatchPlayers": [
              {
                "id": 1,
                "subMatchId": 1,
                "entryMemberId": 1,
                "team": "A",
                "entryMember": null,
                "createdAt": "2026-05-27T00:00:00Z",
                "updatedAt": "2026-05-27T00:00:00Z"
              }
            ],
            "createdAt": "2026-05-27T00:00:00Z",
            "updatedAt": "2026-05-27T00:00:00Z"
          }
        ],
        "matchReferees": [
          {
            "id": 1,
            "matchId": 1,
            "refereeId": 1,
            "referee": null,
            "createdAt": "2026-05-27T00:00:00Z",
            "updatedAt": "2026-05-27T00:00:00Z"
          }
        ],
        "createdAt": "2026-05-27T00:00:00Z",
        "updatedAt": "2026-05-27T00:00:00Z",
        "umpire": 1,
        "assistantUmpire": 1
      }
    ]
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

## POST /api/schedules/generate-knockout
Tag: Schedules
Summary: Generate knockout schedule for a category

Tạo lịch knockout cho 1 category dựa trên knockoutBrackets.
Lấy tất cả brackets kể cả TBD placeholder (trừ bye matches).
Match với TBD sẽ có entryAId / entryBId = null — fill sau khi fillQualifiers().

Nếu truyền roundName → chỉ tạo lịch cho vòng đó (không xóa vòng khác).
Nếu không truyền → tạo lịch cho tất cả vòng, xóa lịch knockout cũ.

Yêu cầu:
- knockoutBrackets đã được generate (generatePlaceholders hoặc generateFromEntries)

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - categoryId: integer | required
  - roundName: string | Chỉ generate cho vòng này (optional) | choices: Round of 64, Round of 32, Round of 16, Quarter-final, Semi-final, Final
Example payload:
```json
{
  "categoryId": 1,
  "roundName": "Quarter-final"
}
```

Responses:
### 201
Description: Knockout schedule generated successfully
Type: object
Body:
  - success: boolean
  - message: string
  - warning: string
  - data: object
    - totalSchedules: integer
    - totalMatches: integer
    - schedules: array
      - items: object
        - id: integer
        - categoryId: integer | required
        - roundNumber: integer
        - groupName: string
        - stage: string | choices: group, knockout | default: "group"
        - knockoutRound: string
        - tableNumber: integer
        - scheduledAt: string | required
        - createdAt: string
        - updatedAt: string
    - matches: array
      - items: object
        - id: integer | Match ID
        - scheduleId: integer | required | ID of the schedule this match belongs to
        - entryAId: integer | required | ID of entry A (first competitor)
        - entryBId: integer | required | ID of entry B (second competitor)
        - status: string | required | Current status of the match | choices: scheduled, in_progress, completed, cancelled | default: "scheduled"
        - winnerEntryId: integer | ID of the winning entry
        - resultStatus: string | Match result approval status | choices: pending, approved, rejected
        - reviewNotes: string | Review notes from chief referee
        - schedule: object
        - entryA: object
        - entryB: object
        - winnerEntry: object
        - subMatches: array
          - items: object
            - id: integer | Unique identifier
            - matchId: integer | required | Parent match ID
            - subMatchNumber: integer | required
            - status: string | required | Current status of the sub-match | choices: scheduled, in_progress, completed | default: "scheduled"
            - winnerTeam: string | Winning team (A or B) | choices: A, B
            - umpireId: integer | Referee ID assigned as umpire
            - assistantUmpireId: integer | Optional assistant umpire ID
            - matchSets: array
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
            - subMatchPlayers: array
              - items: object
                - id: integer | Unique identifier
                - subMatchId: integer | required | Sub-match ID
                - entryMemberId: integer | required | Entry member ID (player)
                - team: string | required | Team assignment | choices: A, B
                - entryMember: object
                - createdAt: string
                - updatedAt: string
            - createdAt: string
            - updatedAt: string
        - matchReferees: array
          - items: object
            - id: integer
            - matchId: integer | required
            - refereeId: integer | required
            - referee: object
            - createdAt: string
            - updatedAt: string
        - createdAt: string
        - updatedAt: string
        - umpire: integer | ID of the umpire
        - assistantUmpire: integer | ID of the assistant umpire
Example response:
```json
{
  "success": true,
  "message": "string",
  "warning": "string",
  "data": {
    "totalSchedules": 1,
    "totalMatches": 1,
    "schedules": [
      {
        "id": 1,
        "categoryId": 1,
        "roundNumber": 1,
        "groupName": "string",
        "stage": "group",
        "knockoutRound": "string",
        "tableNumber": 1,
        "scheduledAt": "2026-05-27T00:00:00Z",
        "createdAt": "2026-05-27T00:00:00Z",
        "updatedAt": "2026-05-27T00:00:00Z"
      }
    ],
    "matches": [
      {
        "id": 1,
        "scheduleId": 1,
        "entryAId": 1,
        "entryBId": 1,
        "status": "scheduled",
        "winnerEntryId": 1,
        "resultStatus": "pending",
        "reviewNotes": "string",
        "schedule": null,
        "entryA": null,
        "entryB": null,
        "winnerEntry": null,
        "subMatches": [
          {
            "id": 1,
            "matchId": 1,
            "subMatchNumber": 1,
            "status": "scheduled",
            "winnerTeam": "A",
            "umpireId": 1,
            "assistantUmpireId": 1,
            "matchSets": [
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
            "subMatchPlayers": [
              {
                "id": 1,
                "subMatchId": 1,
                "entryMemberId": 1,
                "team": "A",
                "entryMember": null,
                "createdAt": "2026-05-27T00:00:00Z",
                "updatedAt": "2026-05-27T00:00:00Z"
              }
            ],
            "createdAt": "2026-05-27T00:00:00Z",
            "updatedAt": "2026-05-27T00:00:00Z"
          }
        ],
        "matchReferees": [
          {
            "id": 1,
            "matchId": 1,
            "refereeId": 1,
            "referee": null,
            "createdAt": "2026-05-27T00:00:00Z",
            "updatedAt": "2026-05-27T00:00:00Z"
          }
        ],
        "createdAt": "2026-05-27T00:00:00Z",
        "updatedAt": "2026-05-27T00:00:00Z",
        "umpire": 1,
        "assistantUmpire": 1
      }
    ]
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

## POST /api/schedules/sync-match-entries
Tag: Schedules
Summary: Sync match entries from brackets after fillQualifiers

Sau khi fillQualifiers() fill entryId thật vào knockoutBrackets,
gọi endpoint này để cập nhật lại entryAId / entryBId trong match tương ứng.

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
Description: Match entries synced successfully
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": true,
  "message": "string"
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

## GET /api/schedules/category/{categoryId}
Tag: Schedules
Summary: Get schedules by category

Lấy danh sách schedules của 1 category, có pagination và filter.

Request parameters:
- categoryId (path) | type: integer | required
- stage (query) | type: string | choices: group, knockout
- groupName (query) | type: string | Filter theo tên bảng (vd: Group A)
- knockoutRound (query) | type: string | choices: Round of 64, Round of 32, Round of 16, Quarter-final, Semi-final, Final
- page (query) | type: integer | default: 1
- limit (query) | type: integer | default: 20

Request body:
None

Responses:
### 200
Description: List of schedules
Type: object
Body:
  - success: boolean
  - data: object
    - schedules: array
      - items: object
        - id: integer
        - categoryId: integer | required
        - roundNumber: integer
        - groupName: string
        - stage: string | choices: group, knockout | default: "group"
        - knockoutRound: string
        - tableNumber: integer
        - scheduledAt: string | required
        - createdAt: string
        - updatedAt: string
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
  "success": true,
  "data": {
    "schedules": [
      {
        "id": 1,
        "categoryId": 1,
        "roundNumber": 1,
        "groupName": "string",
        "stage": "group",
        "knockoutRound": "string",
        "tableNumber": 1,
        "scheduledAt": "2026-05-27T00:00:00Z",
        "createdAt": "2026-05-27T00:00:00Z",
        "updatedAt": "2026-05-27T00:00:00Z"
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

## GET /api/schedules/{id}
Tag: Schedules
Summary: Get schedule by ID

Request parameters:
- id (path) | type: integer | required

Request body:
None

Responses:
### 200
Description: Schedule details
Type: object
Body:
  - success: boolean
  - data: object
    - id: integer
    - categoryId: integer | required
    - roundNumber: integer
    - groupName: string
    - stage: string | choices: group, knockout | default: "group"
    - knockoutRound: string
    - tableNumber: integer
    - scheduledAt: string | required
    - createdAt: string
    - updatedAt: string
Example response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "categoryId": 1,
    "roundNumber": 1,
    "groupName": "string",
    "stage": "group",
    "knockoutRound": "string",
    "tableNumber": 1,
    "scheduledAt": "2026-05-27T00:00:00Z",
    "createdAt": "2026-05-27T00:00:00Z",
    "updatedAt": "2026-05-27T00:00:00Z"
  }
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

## PUT /api/schedules/{id}
Tag: Schedules
Summary: Update schedule (scheduledAt or tableNumber)

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required

Request body:
Required: yes
Type: object
Fields:
  - scheduledAt: string
  - tableNumber: integer
Example payload:
```json
{
  "scheduledAt": "2026-05-27T00:00:00Z",
  "tableNumber": 1
}
```

Responses:
### 200
Description: Schedule updated
Type: object
Body:
  - success: boolean
  - data: object
    - id: integer
    - categoryId: integer | required
    - roundNumber: integer
    - groupName: string
    - stage: string | choices: group, knockout | default: "group"
    - knockoutRound: string
    - tableNumber: integer
    - scheduledAt: string | required
    - createdAt: string
    - updatedAt: string
Example response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "categoryId": 1,
    "roundNumber": 1,
    "groupName": "string",
    "stage": "group",
    "knockoutRound": "string",
    "tableNumber": 1,
    "scheduledAt": "2026-05-27T00:00:00Z",
    "createdAt": "2026-05-27T00:00:00Z",
    "updatedAt": "2026-05-27T00:00:00Z"
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

## DELETE /api/schedules/{id}
Tag: Schedules
Summary: Delete schedule

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required

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
