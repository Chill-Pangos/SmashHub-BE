# Schedules

Schedule management endpoints

Total endpoints: 12

## POST /api/schedules
Tag: Schedules
Summary: Create a new schedule

Request parameters:
None

Request body:
Required: yes
Type: object

Responses:
### 201
Schedule created successfully

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

## GET /api/schedules
Tag: Schedules
Summary: Get all schedules

Request parameters:
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
Description: List of schedules ordered by scheduled time
Type: array
Example response:
```json
[
  null
]
```

---

## POST /api/schedules/generate
Tag: Schedules
Summary: Generate tournament schedules automatically

Automatically generates schedules for all matches in a tournament category.
- Singles and Doubles matches: 20 minutes each
- Team matches: 60 minutes each
- Includes lunch break from 12:00 to 14:00 by default

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - categoryId: integer | required | Tournament category ID
  - startDate: string | required | First day of the tournament
  - startTime: string | Daily start time (HH:MM format) | default: "08:00"
  - endTime: string | Daily end time (HH:MM format) | default: "22:00"
  - lunchBreakStart: string | Lunch break start time (HH:MM format) | default: "12:00"
  - lunchBreakEnd: string | Lunch break end time (HH:MM format) | default: "14:00"
  - roundNumber: integer | Optional round number
  - groupName: string | Optional group name (used when not in group stage mode)
  - isGroupStage: boolean | Enable group stage format (divides entries into multiple groups) | default: false
  - numberOfGroups: integer | Number of groups (auto-calculated if not provided)
  - teamsPerGroup: integer | Number of teams per group (auto-calculated if not provided)
  - includeKnockout: boolean | Generate knockout stage after group stage | default: false
  - teamsAdvancePerGroup: integer | Number of teams advancing from each group to knockout | default: 2
  - knockoutStartDate: string | Start date for knockout stage (auto day after group stage if not provided)
Example payload:
```json
{
  "categoryId": 1,
  "startDate": "2024-06-01",
  "startTime": "08:00",
  "endTime": "22:00",
  "lunchBreakStart": "12:00",
  "lunchBreakEnd": "14:00",
  "roundNumber": 1,
  "groupName": "Group A",
  "isGroupStage": true,
  "numberOfGroups": 4,
  "teamsPerGroup": 4,
  "includeKnockout": true,
  "teamsAdvancePerGroup": 2,
  "knockoutStartDate": "2024-06-10"
}
```

Responses:
### 201
Description: Schedules generated successfully
Type: object
Body:
  - message: string
  - totalMatches: integer
  - schedules: array
    - items: object
Example response:
```json
{
  "message": "string",
  "totalMatches": 1,
  "schedules": [
    null
  ]
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

## POST /api/schedules/update-knockout
Tag: Schedules
Summary: Update knockout stage match entries

Updates knockout stage matches with qualified teams from group stage.
Call this endpoint after group stage results are finalized.

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - categoryId: integer | required | Tournament category ID
  - groupResults: array | required | Array of group results with qualified teams
    - items: object
      - groupName: string
      - qualifiedEntryIds: array
        - items: integer
Example payload:
```json
{
  "categoryId": 1,
  "groupResults": [
    {
      "groupName": "Group A",
      "qualifiedEntryIds": [
        1,
        2
      ]
    }
  ]
}
```

Responses:
### 200
Knockout entries updated successfully

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

## POST /api/schedules/generate-group-stage
Tag: Schedules
Summary: Generate group stage schedules

Tạo schedule cho vòng bảng dựa trên group standings đã có.
Điều kiện:
- Khung giờ: 8h-11h30 (sáng), 13h30-17h (chiều), 18h30-22h (tối)
- Thời gian mỗi trận: Single/Double 30 phút, Team 60 phút
- Các đội không đấu liên tiếp 2 trận trong cùng buổi
- Round-robin: Tất cả đội đấu với nhau trong mỗi bảng

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - categoryId: integer | required | Tournament category ID
  - startDate: string | required | Ngày bắt đầu thi đấu (YYYY-MM-DD)
Example payload:
```json
{
  "categoryId": 1,
  "startDate": "2026-02-01"
}
```

Responses:
### 201
Group stage schedules generated successfully

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

## POST /api/schedules/generate-complete
Tag: Schedules
Summary: Generate complete tournament schedule (group + knockout)

Tạo lịch thi đấu hoàn chỉnh cho tournament category bao gồm:
1. Chia entries thành bảng đấu (nếu chưa có)
2. Tạo knockout brackets từ top 2 mỗi bảng
3. Tạo schedules cho vòng bảng (max 2 trận/ngày)
4. Tạo schedules cho vòng knockout (max 3 trận/ngày, mỗi buổi 1 trận)
5. Đảm bảo kết thúc vòng bảng trước khi bắt đầu knockout

Điều kiện:
- Khung giờ: 8h-11h30 (sáng), 13h30-17h (chiều), 18h30-22h (tối)
- Thời gian mỗi trận: Single/Double 30 phút, Team 90 phút
- Không đấu liên tiếp trong cùng buổi
- Hỗ trợ nhiều bàn thi đấu song song
- Tự động tính toán và validate thời gian

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - categoryId: integer | required | Tournament category ID (startDate và endDate sẽ được lấy từ tournament table)
Example payload:
```json
{
  "categoryId": 1
}
```

Responses:
### 201
Description: Complete schedule generated successfully
Type: object
Body:
  - success: boolean
  - message: string
  - data: object
    - groupStandings: integer
    - groupSchedules: integer
    - groupMatches: integer
    - knockoutBrackets: integer
    - knockoutSchedules: integer
    - knockoutMatches: integer
Example response:
```json
{
  "success": true,
  "message": "string",
  "data": {
    "groupStandings": 1,
    "groupSchedules": 1,
    "groupMatches": 1,
    "knockoutBrackets": 1,
    "knockoutSchedules": 1,
    "knockoutMatches": 1
  }
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

## POST /api/schedules/generate-knockout-only
Tag: Schedules
Summary: Generate knockout-only tournament schedule (no group stage)

Tạo lịch thi đấu cho tournament category chỉ có knockout stage (không qua vòng bảng):
1. Tạo knockout brackets trực tiếp từ entries (nếu chưa có)
2. Tạo schedules cho tất cả các vòng knockout
3. Hỗ trợ placeholder cho các vòng sau

Điều kiện:
- Khung giờ: 8h-11h30 (sáng), 13h30-17h (chiều), 18h30-22h (tối)
- Thời gian mỗi trận: Single/Double 30 phút, Team 90 phút
- Max 3 trận/ngày cho mỗi entry
- Không đấu liên tiếp trong cùng buổi
- Hỗ trợ nhiều bàn thi đấu song song
- startDate và endDate lấy từ tournament table

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - categoryId: integer | required | Tournament category ID (phải có isGroupStage = false)
Example payload:
```json
{
  "categoryId": 2
}
```

Responses:
### 201
Description: Knockout-only schedule generated successfully
Type: object
Body:
  - success: boolean
  - message: string
  - data: object
    - knockoutBrackets: integer
    - knockoutSchedules: integer
    - knockoutMatches: integer
Example response:
```json
{
  "success": true,
  "message": "string",
  "data": {
    "knockoutBrackets": 1,
    "knockoutSchedules": 1,
    "knockoutMatches": 1
  }
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

## POST /api/schedules/generate-knockout-stage
Tag: Schedules
Summary: Generate knockout stage schedules

Tạo schedule cho vòng knockout dựa trên knockout brackets đã được tạo từ group stage.
Điều kiện:
- Khung giờ: 8h-11h30 (sáng), 13h30-17h (chiều), 18h30-22h (tối)
- Thời gian mỗi trận: Single/Double 30 phút, Team 90 phút
- Các đội không đấu liên tiếp 2 trận trong cùng buổi
- Mỗi entry tối đa 2 trận/ngày
- Hỗ trợ nhiều bàn thi đấu song song
- Xếp lịch theo từng vòng: R16, QF, SF, Final

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - categoryId: integer | required | Tournament category ID (phải có knockout brackets đã tạo)
  - startDate: string | required | Ngày bắt đầu vòng knockout (YYYY-MM-DD)
Example payload:
```json
{
  "categoryId": 1,
  "startDate": "2026-02-10"
}
```

Responses:
### 201
Description: Knockout stage schedules generated successfully
Type: object
Body:
  - success: boolean
  - message: string
  - data: object
    - totalSchedules: integer
    - totalMatches: integer
    - schedules: array
      - items: object
    - matches: array
      - items: object
Example response:
```json
{
  "success": true,
  "message": "string",
  "data": {
    "totalSchedules": 1,
    "totalMatches": 1,
    "schedules": [
      null
    ],
    "matches": [
      null
    ]
  }
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

## GET /api/schedules/{id}
Tag: Schedules
Summary: Get schedule by ID

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Schedule details

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

## PUT /api/schedules/{id}
Tag: Schedules
Summary: Update schedule

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Schedule updated

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

## DELETE /api/schedules/{id}
Tag: Schedules
Summary: Delete schedule

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 204
Successfully deleted, no content returned

---

## GET /api/schedules/category/{categoryId}
Tag: Schedules
Summary: Get schedules by tournament category ID

Retrieve all schedules for a specific tournament category, with optional filtering by stage

Request parameters:
- categoryId (path) | type: number | required | ID of the tournament category
- stage (query) | type: string | Filter by stage (group or knockout) | choices: group, knockout
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
Description: List of schedules for the tournament category
Type: object
Body:
  - success: boolean
  - data: object
    - schedules: array
      - items: object
    - count: number
    - offset: number
    - limit: number
Example response:
```json
{
  "success": true,
  "data": {
    "schedules": [
      null
    ],
    "count": 1,
    "offset": 1,
    "limit": 1
  }
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
