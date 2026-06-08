# Knockout Brackets

Knockout bracket management endpoints

Total endpoints: 8

## POST /api/knockout-brackets/placeholders
Tag: Knockout Brackets
Summary: Generate TBD placeholders based on number of groups

Tạo bracket với toàn bộ slots là TBD dựa trên số bảng hiện có.
Dùng để tạo schedule trước khi vòng bảng kết thúc.
Số slots = số bảng × 2 (nhất + nhì mỗi bảng).
Sau khi vòng bảng kết thúc, gọi /fill-qualifiers để fill entryId thật.

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
Description: Bracket placeholders generated successfully
Type: object
Body:
  - success: boolean
  - data: object
    - categoryId: integer | required
    - totalRounds: integer | required
    - totalBrackets: integer | required
    - rounds: array | required
      - items: object
        - roundNumber: integer | required
        - roundName: string | required | choices: Round of 64, Round of 32, Round of 16, Quarter-final, Semi-final, Final
        - brackets: array | required
          - items: object
            - id: integer | required
            - roundNumber: integer | required
            - roundName: string | required | choices: Round of 64, Round of 32, Round of 16, Quarter-final, Semi-final, Final
            - bracketPosition: integer | required
            - entryA: object | required
              - entryId: integer | required
              - entryName: string | required
            - entryB: object | required
              - entryId: integer | required
              - entryName: string | required
            - winnerEntryId: integer | required
            - status: string | required | choices: pending, ready, in_progress, completed
            - isByeMatch: boolean | required
            - previousBracketAId: integer | required
            - previousBracketBId: integer | required
            - nextBracketId: integer | required
  - message: string
Example response:
```json
{
  "success": true,
  "data": {
    "categoryId": 1,
    "totalRounds": 1,
    "totalBrackets": 1,
    "rounds": [
      {
        "roundNumber": 1,
        "roundName": "Round of 64",
        "brackets": [
          {
            "id": 1,
            "roundNumber": 1,
            "roundName": "Round of 64",
            "bracketPosition": 1,
            "entryA": {
              "entryId": 1,
              "entryName": "TBD"
            },
            "entryB": {
              "entryId": 1,
              "entryName": "TBD"
            },
            "winnerEntryId": 1,
            "status": "pending",
            "isByeMatch": true,
            "previousBracketAId": 1,
            "previousBracketBId": 1,
            "nextBracketId": 1
          }
        ]
      }
    ]
  },
  "message": "Bracket placeholders generated successfully"
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

## POST /api/knockout-brackets/fill-qualifiers
Tag: Knockout Brackets
Summary: Fill real qualifiers into TBD placeholder brackets

Fill entryId thật vào bracket round 1 sau khi vòng bảng kết thúc.
Yêu cầu tất cả bảng đã có đủ kết quả xếp hạng (nhất + nhì).
Đội nhất các bảng vào top half, đội nhì vào bottom half
để đảm bảo đội nhất và nhì cùng bảng không gặp nhau trước Final.
Bracket bye sẽ được tự động fill vào vòng tiếp theo.

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
Description: Qualifiers filled into bracket successfully
Type: object
Body:
  - success: boolean
  - data: object
    - categoryId: integer | required
    - totalRounds: integer | required
    - totalBrackets: integer | required
    - rounds: array | required
      - items: object
        - roundNumber: integer | required
        - roundName: string | required | choices: Round of 64, Round of 32, Round of 16, Quarter-final, Semi-final, Final
        - brackets: array | required
          - items: object
            - id: integer | required
            - roundNumber: integer | required
            - roundName: string | required | choices: Round of 64, Round of 32, Round of 16, Quarter-final, Semi-final, Final
            - bracketPosition: integer | required
            - entryA: object | required
              - entryId: integer | required
              - entryName: string | required
            - entryB: object | required
              - entryId: integer | required
              - entryName: string | required
            - winnerEntryId: integer | required
            - status: string | required | choices: pending, ready, in_progress, completed
            - isByeMatch: boolean | required
            - previousBracketAId: integer | required
            - previousBracketBId: integer | required
            - nextBracketId: integer | required
  - message: string
Example response:
```json
{
  "success": true,
  "data": {
    "categoryId": 1,
    "totalRounds": 1,
    "totalBrackets": 1,
    "rounds": [
      {
        "roundNumber": 1,
        "roundName": "Round of 64",
        "brackets": [
          {
            "id": 1,
            "roundNumber": 1,
            "roundName": "Round of 64",
            "bracketPosition": 1,
            "entryA": {
              "entryId": 1,
              "entryName": "TBD"
            },
            "entryB": {
              "entryId": 1,
              "entryName": "TBD"
            },
            "winnerEntryId": 1,
            "status": "pending",
            "isByeMatch": true,
            "previousBracketAId": 1,
            "previousBracketBId": 1,
            "nextBracketId": 1
          }
        ]
      }
    ]
  },
  "message": "Qualifiers filled into bracket successfully"
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

## POST /api/knockout-brackets/from-entries
Tag: Knockout Brackets
Summary: Generate knockout bracket from eligible entries (no group stage)

Tạo bracket trực tiếp từ danh sách entry đủ điều kiện.
Chỉ dùng cho giải đấu không có vòng bảng (isGroupStage = false).
Tự động tính bracket size (lũy thừa 2), phân bổ bye đều 2 nửa.

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
Description: Knockout bracket generated successfully
Type: object
Body:
  - success: boolean
  - data: object
    - categoryId: integer | required
    - totalRounds: integer | required
    - totalBrackets: integer | required
    - rounds: array | required
      - items: object
        - roundNumber: integer | required
        - roundName: string | required | choices: Round of 64, Round of 32, Round of 16, Quarter-final, Semi-final, Final
        - brackets: array | required
          - items: object
            - id: integer | required
            - roundNumber: integer | required
            - roundName: string | required | choices: Round of 64, Round of 32, Round of 16, Quarter-final, Semi-final, Final
            - bracketPosition: integer | required
            - entryA: object | required
              - entryId: integer | required
              - entryName: string | required
            - entryB: object | required
              - entryId: integer | required
              - entryName: string | required
            - winnerEntryId: integer | required
            - status: string | required | choices: pending, ready, in_progress, completed
            - isByeMatch: boolean | required
            - previousBracketAId: integer | required
            - previousBracketBId: integer | required
            - nextBracketId: integer | required
  - message: string
Example response:
```json
{
  "success": true,
  "data": {
    "categoryId": 1,
    "totalRounds": 1,
    "totalBrackets": 1,
    "rounds": [
      {
        "roundNumber": 1,
        "roundName": "Round of 64",
        "brackets": [
          {
            "id": 1,
            "roundNumber": 1,
            "roundName": "Round of 64",
            "bracketPosition": 1,
            "entryA": {
              "entryId": 1,
              "entryName": "TBD"
            },
            "entryB": {
              "entryId": 1,
              "entryName": "TBD"
            },
            "winnerEntryId": 1,
            "status": "pending",
            "isByeMatch": true,
            "previousBracketAId": 1,
            "previousBracketBId": 1,
            "nextBracketId": 1
          }
        ]
      }
    ]
  },
  "message": "Knockout bracket generated successfully"
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

## POST /api/knockout-brackets/{id}/advance-winner
Tag: Knockout Brackets
Summary: Advance winner to next round

Ghi nhận kết quả trận đấu và fill winner vào bracket vòng tiếp theo.
Bracket tiếp theo sẽ chuyển sang "ready" khi cả 2 slot đã có entry.
Bracket phải đang ở trạng thái "ready" hoặc "in_progress".
Winner phải là entryA hoặc entryB của bracket hiện tại.

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Bracket ID

Request body:
Required: yes
Type: object
Fields:
  - winnerEntryId: integer | required
Example payload:
```json
{
  "winnerEntryId": 5
}
```

Responses:
### 200
Description: Winner advanced successfully
Type: object
Body:
  - success: boolean
  - data: object
    - id: integer
    - categoryId: integer | required
    - roundNumber: integer | required
    - bracketPosition: integer | required
    - roundName: string | required | choices: Round of 64, Round of 32, Round of 16, Quarter-final, Semi-final, Final
    - scheduleId: integer
    - matchId: integer
    - entryAId: integer
    - entryBId: integer
    - winnerEntryId: integer
    - nextBracketId: integer
    - previousBracketAId: integer
    - previousBracketBId: integer
    - status: string | choices: pending, ready, in_progress, completed | default: "pending"
    - isByeMatch: boolean | default: false
    - createdAt: string
    - updatedAt: string
  - message: string
Example response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "categoryId": 1,
    "roundNumber": 1,
    "bracketPosition": 1,
    "roundName": "Round of 64",
    "scheduleId": 1,
    "matchId": 1,
    "entryAId": 1,
    "entryBId": 1,
    "winnerEntryId": 1,
    "nextBracketId": 1,
    "previousBracketAId": 1,
    "previousBracketBId": 1,
    "status": "pending",
    "isByeMatch": false,
    "createdAt": "2026-05-27T00:00:00Z",
    "updatedAt": "2026-05-27T00:00:00Z"
  },
  "message": "Winner advanced to the next round successfully"
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

## GET /api/knockout-brackets/validate/{categoryId}
Tag: Knockout Brackets
Summary: Validate bracket tree integrity

Kiểm tra bracket tree hợp lệ trước khi bắt đầu giải.
Các check bao gồm:
- Số lượng brackets đúng với bracket size (2^n - 1)
- Round 1 không còn TBD (fillQualifiers đã chạy)
- Không có entry trùng lặp
- nextBracketId / previousBracketId liên kết đúng

Auth: bearerAuth

Request parameters:
- categoryId (path) | type: integer | required

Request body:
None

Responses:
### 200
Description: Validation result
Type: object
Body:
  - success: boolean
  - data: object
    - valid: boolean
    - errors: array
      - items: string
Example response:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "errors": []
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

## GET /api/knockout-brackets/tree/{categoryId}
Tag: Knockout Brackets
Summary: Get complete bracket tree

Lấy toàn bộ bracket tree phân tầng theo từng round.
Slots chưa có entry sẽ hiện entryName = "TBD".

Request parameters:
- categoryId (path) | type: integer | required

Request body:
None

Responses:
### 200
Description: Bracket tree retrieved successfully
Type: object
Body:
  - success: boolean
  - data: object
    - categoryId: integer | required
    - totalRounds: integer | required
    - totalBrackets: integer | required
    - rounds: array | required
      - items: object
        - roundNumber: integer | required
        - roundName: string | required | choices: Round of 64, Round of 32, Round of 16, Quarter-final, Semi-final, Final
        - brackets: array | required
          - items: object
            - id: integer | required
            - roundNumber: integer | required
            - roundName: string | required | choices: Round of 64, Round of 32, Round of 16, Quarter-final, Semi-final, Final
            - bracketPosition: integer | required
            - entryA: object | required
              - entryId: integer | required
              - entryName: string | required
            - entryB: object | required
              - entryId: integer | required
              - entryName: string | required
            - winnerEntryId: integer | required
            - status: string | required | choices: pending, ready, in_progress, completed
            - isByeMatch: boolean | required
            - previousBracketAId: integer | required
            - previousBracketBId: integer | required
            - nextBracketId: integer | required
Example response:
```json
{
  "success": true,
  "data": {
    "categoryId": 1,
    "totalRounds": 1,
    "totalBrackets": 1,
    "rounds": [
      {
        "roundNumber": 1,
        "roundName": "Round of 64",
        "brackets": [
          {
            "id": 1,
            "roundNumber": 1,
            "roundName": "Round of 64",
            "bracketPosition": 1,
            "entryA": {
              "entryId": 1,
              "entryName": "TBD"
            },
            "entryB": {
              "entryId": 1,
              "entryName": "TBD"
            },
            "winnerEntryId": 1,
            "status": "pending",
            "isByeMatch": true,
            "previousBracketAId": 1,
            "previousBracketBId": 1,
            "nextBracketId": 1
          }
        ]
      }
    ]
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

## GET /api/knockout-brackets/standings/{categoryId}
Tag: Knockout Brackets
Summary: Get final tournament standings

Lấy xếp hạng cuối giải sau khi Final hoàn thành.
- Champion: winner của Final
- Runner-up: loser của Final
- Third place: 2 loser của Semi-final (đồng hạng 3)
- Eliminated: danh sách bị loại theo từng vòng

Request parameters:
- categoryId (path) | type: integer | required

Request body:
None

Responses:
### 200
Description: Standings retrieved successfully
Type: object
Body:
  - success: boolean
  - data: object
    - champion: integer
    - runnerUp: integer
    - thirdPlace: array
      - items: integer
    - eliminated: array
      - items: object
        - entryId: integer
        - eliminatedAt: string
Example response:
```json
{
  "success": true,
  "data": {
    "champion": 5,
    "runnerUp": 8,
    "thirdPlace": [
      3,
      7
    ],
    "eliminated": [
      {
        "entryId": 1,
        "eliminatedAt": "Quarter-final"
      }
    ]
  }
}
```

### 400
Tournament not completed yet

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

## GET /api/knockout-brackets/category/{categoryId}/entry
Tag: Knockout Brackets
Summary: Get brackets for a specific entry

Lấy tất cả brackets liên quan đến 1 entry.
Filter theo entryId (exact) hoặc entryName (partial match).

Request parameters:
- categoryId (path) | type: integer | required
- entryId (query) | type: integer
- entryName (query) | type: string
- page (query) | type: integer | default: 1
- limit (query) | type: integer | default: 10

Request body:
None

Responses:
### 200
Description: Entry brackets retrieved successfully
Type: object
Body:
  - success: boolean
  - data: object
    - brackets: array
      - items: object
        - id: integer | required
        - roundNumber: integer | required
        - roundName: string | required | choices: Round of 64, Round of 32, Round of 16, Quarter-final, Semi-final, Final
        - bracketPosition: integer | required
        - entryA: object | required
          - entryId: integer | required
          - entryName: string | required
        - entryB: object | required
          - entryId: integer | required
          - entryName: string | required
        - winnerEntryId: integer | required
        - status: string | required | choices: pending, ready, in_progress, completed
        - isByeMatch: boolean | required
        - previousBracketAId: integer | required
        - previousBracketBId: integer | required
        - nextBracketId: integer | required
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
    "brackets": [
      {
        "id": 1,
        "roundNumber": 1,
        "roundName": "Round of 64",
        "bracketPosition": 1,
        "entryA": {
          "entryId": 1,
          "entryName": "TBD"
        },
        "entryB": {
          "entryId": 1,
          "entryName": "TBD"
        },
        "winnerEntryId": 1,
        "status": "pending",
        "isByeMatch": true,
        "previousBracketAId": 1,
        "previousBracketBId": 1,
        "nextBracketId": 1
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
