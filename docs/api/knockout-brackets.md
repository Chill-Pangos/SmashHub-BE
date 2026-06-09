# Knockout Brackets

Knockout bracket management endpoints

Total endpoints: 9

## POST /api/knockout-brackets/preview-placeholders
Tag: Knockout Brackets
Summary: Preview TBD placeholder bracket tree

Preview bracket placeholders without saving to database. Use /knockout-brackets/save-assignments with categoryId only to persist after organizer review.

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
Description: Bracket placeholder preview generated successfully
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

## POST /api/knockout-brackets/preview-fill-qualifiers
Tag: Knockout Brackets
Summary: Preview filling qualifiers into brackets

Preview shuffled qualifier placement without saving. Response includes entryIds; send same entryIds to /knockout-brackets/save-assignments to persist exactly what organizer reviewed.

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
Description: Qualifier placement preview generated successfully. data.entryIds contains save order and data.bracketTree contains preview tree.
Type: object
Body:
  - success: boolean
  - data: object
    - entryIds: array
      - items: integer
    - bracketTree: object
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
    "entryIds": [
      5,
      9,
      2,
      12
    ],
    "bracketTree": {
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
  },
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

## POST /api/knockout-brackets/preview-from-entries
Tag: Knockout Brackets
Summary: Preview knockout bracket from eligible entries

Preview shuffled knockout bracket without saving. Response includes entryIds; send same entryIds to /knockout-brackets/save-assignments to persist exactly what organizer reviewed.

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
Description: Knockout bracket preview generated successfully. data.entryIds contains save order and data.bracketTree contains preview tree.
Type: object
Body:
  - success: boolean
  - data: object
    - entryIds: array
      - items: integer
    - bracketTree: object
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
    "entryIds": [
      8,
      3,
      12,
      6
    ],
    "bracketTree": {
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
  },
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

## POST /api/knockout-brackets/save-assignments
Tag: Knockout Brackets
Summary: Save knockout bracket assignments

Persist approved knockout preview to database after organizer confirmation.

**Workflow**:
1. Preview TBD placeholders: gọi `/knockout-brackets/preview-placeholders`, rồi save body chỉ cần `categoryId`
2. Preview qualifiers: gọi `/knockout-brackets/preview-fill-qualifiers`, rồi save body có `categoryId` + `entryIds`
3. Preview direct knockout: gọi `/knockout-brackets/preview-from-entries`, rồi save body có `categoryId` + `entryIds`

**Validation**:
- `categoryId` luôn bắt buộc
- `entryIds` optional khi save placeholders
- `entryIds` bắt buộc khi save qualifiers hoặc direct knockout
- Nếu có `entryIds`, danh sách phải là positive integer và khớp các entry có thể preview

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - categoryId: integer | required
  - entryIds: array | Optional for preview-placeholders save. Required order returned by preview-fill-qualifiers or preview-from-entries.
    - items: integer
  - assignments: array | Backward-compatible alias for entryIds.
    - items: integer
Example payload:
```json
{
  "categoryId": 1,
  "entryIds": [
    8,
    3,
    12,
    6
  ],
  "assignments": [
    8,
    3,
    12,
    6
  ]
}
```

Responses:
### 201
Description: Knockout bracket assignments saved successfully
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
  "message": "Knockout bracket assignments saved successfully"
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
