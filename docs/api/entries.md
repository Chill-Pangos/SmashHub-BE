# Entries

Entry management endpoints

Total endpoints: 22

## POST /api/entries/register
Tag: Entries
Summary: Register for tournament

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - categoryId: integer
  - action: string | choices: create_team, join_team
  - targetEntryId: integer
Example payload:
```json
{
  "categoryId": 1,
  "action": "create_team",
  "targetEntryId": 1
}
```

Responses:
### 201
Registration successful

---

## GET /api/entries/category/{categoryId}
Tag: Entries
Summary: Get entries by category with filters

Request parameters:
- categoryId (path) | type: integer | required
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10
- isFull (query) | type: boolean
- isAcceptingMembers (query) | type: boolean
- captainName (query) | type: string

Request body:
None

Responses:
### 200
List of entries

---

## GET /api/entries/me
Tag: Entries
Summary: Get current user's entries with role (captain or member)

Auth: bearerAuth

Request parameters:
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
List of user's entries with role information

---

## GET /api/entries/{entryId}
Tag: Entries
Summary: Get entry by ID

Request parameters:
- entryId (path) | type: integer | required

Request body:
None

Responses:
### 200
Entry details

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

## PUT /api/entries/{entryId}
Tag: Entries
Summary: Update entry (captain only)

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required

Request body:
Required: yes
Type: object

Responses:
### 200
Entry updated

---

## DELETE /api/entries/{entryId}
Tag: Entries
Summary: Delete entry (captain only)

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required

Request body:
None

Responses:
### 204
Successfully deleted, no content returned

---

## POST /api/entries/{entryId}/add-member
Tag: Entries
Summary: Add member to entry (captain only)

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required

Request body:
Required: yes
Type: object
Fields:
  - newMemberId: integer
Example payload:
```json
{
  "newMemberId": 1
}
```

Responses:
### 201
Member added

---

## POST /api/entries/{entryId}/remove-member
Tag: Entries
Summary: Remove member from entry (captain only)

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required

Request body:
Required: yes
Type: object
Fields:
  - memberId: integer
Example payload:
```json
{
  "memberId": 1
}
```

Responses:
### 204
Member removed

---

## GET /api/entries/{entryId}/members
Tag: Entries
Summary: Get all members of entry with pagination

Request parameters:
- entryId (path) | type: integer | required
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
Description: List of members with pagination
Type: object
Body:
  - members: array
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
  "members": [
    null
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
```

---

## POST /api/entries/{entryId}/leave
Tag: Entries
Summary: Leave entry (member only)

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required

Request body:
None

Responses:
### 204
Left entry

---

## POST /api/entries/{entryId}/set-required-members
Tag: Entries
Summary: Set required member count (captain only, team entries)

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required

Request body:
Required: yes
Type: object
Fields:
  - count: integer
Example payload:
```json
{
  "count": 1
}
```

Responses:
### 200
Required member count set

---

## POST /api/entries/{entryId}/transfer-captaincy
Tag: Entries
Summary: Transfer captaincy to another member

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required

Request body:
Required: yes
Type: object
Fields:
  - newCaptainId: integer
Example payload:
```json
{
  "newCaptainId": 1
}
```

Responses:
### 200
Captaincy transferred

---

## GET /api/entries/{entryId}/join-requests
Tag: Entries
Summary: Get join requests for entry with pagination

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10
- status (query) | type: string | choices: pending, approved, rejected

Request body:
None

Responses:
### 200
Description: List of join requests with pagination
Type: object
Body:
  - joinRequests: array
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
  "joinRequests": [
    null
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
```

---

## POST /api/entries/join-requests/{joinRequestId}/respond
Tag: Entries
Summary: Respond to join request (captain only)

Auth: bearerAuth

Request parameters:
- joinRequestId (path) | type: integer | required

Request body:
Required: yes
Type: object
Fields:
  - action: string | choices: approve, reject
  - rejectionReason: string
Example payload:
```json
{
  "action": "approve",
  "rejectionReason": "string"
}
```

Responses:
### 200
Join request responded

---

## POST /api/entries/{entryId}/confirm-lineup
Tag: Entries
Summary: Confirm lineup (captain only)

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required

Request body:
None

Responses:
### 200
Lineup confirmed

---

## GET /api/entries/category/{categoryId}/eligible
Tag: Entries
Summary: Get eligible entries for competition with pagination

Request parameters:
- categoryId (path) | type: integer | required
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
Description: Eligible and ineligible entries with pagination
Type: object
Body:
  - eligible: array
    - items: object
  - ineligible: array
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
  "eligible": [
    null
  ],
  "ineligible": [
    null
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
```

---

## POST /api/entries/category/{categoryId}/disqualify
Tag: Entries
Summary: Disqualify ineligible entries (organizer only)

Auth: bearerAuth

Request parameters:
- categoryId (path) | type: integer | required

Request body:
None

Responses:
### 200
Ineligible entries disqualified

---

## GET /api/entries/{entryId}/my-role
Tag: Entries
Summary: Get current user's role in a specific entry

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required

Request body:
None

Responses:
### 200
User's role (captain, member, or null)

---

## POST /api/entries/import/preview
Tag: Entries
Summary: Preview Excel import data for single entries

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - file: string | required | Excel file (.xlsx or .xls) containing entries data
  - categoryId: integer | required | ID of the tournament category (must be type 'single')
Example payload:
```json
{
  "file": "string",
  "categoryId": 1
}
```

Responses:
### 200
Description: Excel file parsed and validated successfully
Type: object
Body:
  - success: boolean
  - data: object
    - valid: boolean
    - entries: array
      - items: object
        - name: string
        - userId: number
        - email: string
        - rowNumber: number
    - errors: array
      - items: object
        - rowNumber: number
        - field: string
        - message: string
        - value: string
    - summary: object
      - totalEntries: number
      - entriesWithErrors: number
      - contentType: string
      - maxEntries: number
      - currentEntries: number
      - availableSlots: number
Example response:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "entries": [
      {
        "name": "John Doe",
        "userId": 1,
        "email": "john@example.com",
        "rowNumber": 2
      }
    ],
    "errors": [
      {
        "rowNumber": 5,
        "field": "email",
        "message": "Invalid email format",
        "value": "invalid-email"
      }
    ],
    "summary": {
      "totalEntries": 10,
      "entriesWithErrors": 0,
      "contentType": "single",
      "maxEntries": 32,
      "currentEntries": 5,
      "availableSlots": 27
    }
  }
}
```

### 400
Invalid file or validation errors

### 401
Unauthorized

---

## POST /api/entries/import/confirm
Tag: Entries
Summary: Confirm and save imported entries

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - categoryId: number | required
  - entries: array | required
    - items: object
      - name: string
      - userId: number
      - email: string
      - rowNumber: number
Example payload:
```json
{
  "categoryId": 1,
  "entries": [
    {
      "name": "John Doe",
      "userId": 1,
      "email": "john@example.com",
      "rowNumber": 2
    }
  ]
}
```

Responses:
### 201
Description: Entries created successfully
Type: object
Body:
  - success: boolean
  - message: string
  - data: object
    - success: boolean
    - createdEntries: number
    - entryIds: array
      - items: number
Example response:
```json
{
  "success": true,
  "message": "Entries imported successfully",
  "data": {
    "success": true,
    "createdEntries": 10,
    "entryIds": [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10
    ]
  }
}
```

### 400
Invalid data or import failed

### 401
Unauthorized

---

## POST /api/entries/import/double/preview
Tag: Entries
Summary: Preview Excel import data for double entries

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - file: string | required | Excel file (.xlsx or .xls) with double entries (5 columns STT, Player1 Name, Email, Player2 Name, Email)
  - categoryId: integer | required | ID of the tournament category (must be type 'double')
Example payload:
```json
{
  "file": "string",
  "categoryId": 2
}
```

Responses:
### 200
Excel file parsed and validated successfully

### 400
Invalid file or validation errors

### 401
Unauthorized

---

## POST /api/entries/import/double/confirm
Tag: Entries
Summary: Confirm and save imported double entries

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - categoryId: number | required
  - entries: array | required
    - items: object
      - player1Name: string
      - player1UserId: number
      - player1Email: string
      - player2Name: string
      - player2UserId: number
      - player2Email: string
      - rowNumber: number
Example payload:
```json
{
  "categoryId": 2,
  "entries": [
    {
      "player1Name": "John Doe",
      "player1UserId": 1,
      "player1Email": "john@example.com",
      "player2Name": "Jane Smith",
      "player2UserId": 2,
      "player2Email": "jane@example.com",
      "rowNumber": 2
    }
  ]
}
```

Responses:
### 201
Double entries created successfully

### 400
Invalid data or import failed

### 401
Unauthorized

---
