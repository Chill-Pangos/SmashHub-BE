# Entries

Entry management endpoints

Total endpoints: 14

## POST /api/entries/register
Tag: Entries
Summary: Register for tournament (create team or join existing)

Register a user for a tournament category. For single entries, a team is automatically created.
For double/team entries, user can either create a new team or request to join an existing team.

Validation rules:
- User must pass category eligibility checks (gender, age, ELO)
- User cannot already be registered in this category (as captain or member)
- Registration window must be open for the tournament
- When joining, target team must be accepting members and not full

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - categoryId: integer | required
  - action: string | required | choices: create_team, join_team
  - name: string | Entry/team name. Optional; defaults to current user's full name when creating an entry.
  - targetEntryId: integer
Example payload:
```json
{
  "categoryId": 1,
  "action": "create_team",
  "name": "string",
  "targetEntryId": 1
}
```

Responses:
### 201
Description: Registration successful
Type: object
Body:
  - entry: object
    - id: integer | Entry ID
    - categoryId: integer | required | ID of the tournament category this entry belongs to
    - captainId: integer | ID of the team captain
    - name: string | required
    - isAcceptingMembers: boolean | Whether the entry is accepting new members | default: false
    - requiredMemberCount: integer | Number of members required
    - currentMemberCount: integer | Current number of members | default: 0
    - isConfirmed: boolean | default: false
    - confirmedAt: string
    - category: object
    - captain: object
    - members: array
      - items: object
        - id: integer
        - entryId: integer | required
        - userId: integer | required
        - eloAtEntry: integer | required | Player ELO snapshot at registration time
        - entry: object
        - user: object
        - createdAt: string
        - updatedAt: string
    - createdAt: string
    - updatedAt: string
  - message: string
Example response:
```json
{
  "entry": {
    "id": 1,
    "categoryId": 1,
    "captainId": 1,
    "name": "string",
    "isAcceptingMembers": false,
    "requiredMemberCount": 1,
    "currentMemberCount": 0,
    "isConfirmed": false,
    "confirmedAt": "2026-05-27T00:00:00Z",
    "category": null,
    "captain": null,
    "members": [
      {
        "id": 1,
        "entryId": 1,
        "userId": 1,
        "eloAtEntry": 1,
        "entry": null,
        "user": null,
        "createdAt": "2026-05-27T00:00:00Z",
        "updatedAt": "2026-05-27T00:00:00Z"
      }
    ],
    "createdAt": "2026-05-27T00:00:00Z",
    "updatedAt": "2026-05-27T00:00:00Z"
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

## GET /api/entries/category/{categoryId}
Tag: Entries
Summary: Get entries by category with pagination and filters

Request parameters:
- categoryId (path) | type: integer | required
- page (query) | type: integer | default: 1
- limit (query) | type: integer | default: 10
- isFull (query) | type: boolean
- isAcceptingMembers (query) | type: boolean
- captainName (query) | type: string

Request body:
None

Responses:
### 200
Description: List of entries with pagination
Type: object
Body:
  - rows: array
    - items: object
      - id: integer | Entry ID
      - categoryId: integer | required | ID of the tournament category this entry belongs to
      - captainId: integer | ID of the team captain
      - name: string | required
      - isAcceptingMembers: boolean | Whether the entry is accepting new members | default: false
      - requiredMemberCount: integer | Number of members required
      - currentMemberCount: integer | Current number of members | default: 0
      - isConfirmed: boolean | default: false
      - confirmedAt: string
      - category: object
      - captain: object
      - members: array
        - items: object
          - id: integer
          - entryId: integer | required
          - userId: integer | required
          - eloAtEntry: integer | required | Player ELO snapshot at registration time
          - entry: object
          - user: object
          - createdAt: string
          - updatedAt: string
      - createdAt: string
      - updatedAt: string
  - count: integer
Example response:
```json
{
  "rows": [
    {
      "id": 1,
      "categoryId": 1,
      "captainId": 1,
      "name": "string",
      "isAcceptingMembers": false,
      "requiredMemberCount": 1,
      "currentMemberCount": 0,
      "isConfirmed": false,
      "confirmedAt": "2026-05-27T00:00:00Z",
      "category": null,
      "captain": null,
      "members": [
        {
          "id": 1,
          "entryId": 1,
          "userId": 1,
          "eloAtEntry": 1,
          "entry": null,
          "user": null,
          "createdAt": "2026-05-27T00:00:00Z",
          "updatedAt": "2026-05-27T00:00:00Z"
        }
      ],
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z"
    }
  ],
  "count": 1
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

## GET /api/entries/category/{categoryId}/eligible
Tag: Entries
Summary: Get eligible and ineligible entries for competition

Entry is ELIGIBLE when:
1. Has sufficient members (currentMemberCount >= requiredMemberCount)
2. Captain confirmed the lineup (isConfirmed = true)
3. Entry fee paid (if applicable)

Request parameters:
- categoryId (path) | type: integer | required
- page (query) | type: integer | default: 1
- limit (query) | type: integer | default: 10

Request body:
None

Responses:
### 200
Description: Eligible and ineligible entries with pagination
Type: object
Body:
  - eligible: array
    - items: object
      - id: integer | Entry ID
      - categoryId: integer | required | ID of the tournament category this entry belongs to
      - captainId: integer | ID of the team captain
      - name: string | required
      - isAcceptingMembers: boolean | Whether the entry is accepting new members | default: false
      - requiredMemberCount: integer | Number of members required
      - currentMemberCount: integer | Current number of members | default: 0
      - isConfirmed: boolean | default: false
      - confirmedAt: string
      - category: object
      - captain: object
      - members: array
        - items: object
          - id: integer
          - entryId: integer | required
          - userId: integer | required
          - eloAtEntry: integer | required | Player ELO snapshot at registration time
          - entry: object
          - user: object
          - createdAt: string
          - updatedAt: string
      - createdAt: string
      - updatedAt: string
  - ineligible: array
    - items: object
      - entry: object
        - id: integer | Entry ID
        - categoryId: integer | required | ID of the tournament category this entry belongs to
        - captainId: integer | ID of the team captain
        - name: string | required
        - isAcceptingMembers: boolean | Whether the entry is accepting new members | default: false
        - requiredMemberCount: integer | Number of members required
        - currentMemberCount: integer | Current number of members | default: 0
        - isConfirmed: boolean | default: false
        - confirmedAt: string
        - category: object
        - captain: object
        - members: array
          - items: object
            - id: integer
            - entryId: integer | required
            - userId: integer | required
            - eloAtEntry: integer | required | Player ELO snapshot at registration time
            - entry: object
            - user: object
            - createdAt: string
            - updatedAt: string
        - createdAt: string
        - updatedAt: string
      - reasons: array
        - items: string
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
  "eligible": [
    {
      "id": 1,
      "categoryId": 1,
      "captainId": 1,
      "name": "string",
      "isAcceptingMembers": false,
      "requiredMemberCount": 1,
      "currentMemberCount": 0,
      "isConfirmed": false,
      "confirmedAt": "2026-05-27T00:00:00Z",
      "category": null,
      "captain": null,
      "members": [
        {
          "id": 1,
          "entryId": 1,
          "userId": 1,
          "eloAtEntry": 1,
          "entry": null,
          "user": null,
          "createdAt": "2026-05-27T00:00:00Z",
          "updatedAt": "2026-05-27T00:00:00Z"
        }
      ],
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z"
    }
  ],
  "ineligible": [
    {
      "entry": {
        "id": 1,
        "categoryId": 1,
        "captainId": 1,
        "name": "string",
        "isAcceptingMembers": false,
        "requiredMemberCount": 1,
        "currentMemberCount": 0,
        "isConfirmed": false,
        "confirmedAt": "2026-05-27T00:00:00Z",
        "category": null,
        "captain": null,
        "members": [
          {
            "id": 1,
            "entryId": 1,
            "userId": 1,
            "eloAtEntry": 1,
            "entry": null,
            "user": null,
            "createdAt": "2026-05-27T00:00:00Z",
            "updatedAt": "2026-05-27T00:00:00Z"
          }
        ],
        "createdAt": "2026-05-27T00:00:00Z",
        "updatedAt": "2026-05-27T00:00:00Z"
      },
      "reasons": [
        "string"
      ]
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

## POST /api/entries/category/{categoryId}/disqualify
Tag: Entries
Summary: Disqualify ineligible entries (organizer only)

Mass remove all ineligible entries after registration closes.
Only tournament organizer can perform. Operation is permanent.

Auth: bearerAuth

Request parameters:
- categoryId (path) | type: integer | required

Request body:
None

Responses:
### 200
Description: Ineligible entries disqualified
Type: object
Body:
  - deletedCount: integer
  - deleted: array
    - items: object
      - entryId: integer
      - reasons: array
        - items: string
Example response:
```json
{
  "deletedCount": 1,
  "deleted": [
    {
      "entryId": 1,
      "reasons": [
        "string"
      ]
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

## POST /api/entries/join-requests/{joinRequestId}/respond
Tag: Entries
Summary: Respond to join request (captain only)

On Approval: user added to team, member count incremented, team closes if full.
On Rejection: request marked rejected with optional reason.

Auth: bearerAuth

Request parameters:
- joinRequestId (path) | type: integer | required

Request body:
Required: yes
Type: object
Fields:
  - action: string | required | choices: approve, reject
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
Description: Join request responded
Type: object
Example response:
```json
{
  "id": 1,
  "type": "requested",
  "entryId": 1,
  "userId": 1,
  "status": "pending",
  "rejectionReason": "string",
  "respondedAt": "2026-05-27T00:00:00Z",
  "entry": null,
  "user": null,
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

## GET /api/entries/me
Tag: Entries
Summary: Get current user's entries with role information

Auth: bearerAuth

Request parameters:
- page (query) | type: integer | default: 1
- limit (query) | type: integer | default: 10

Request body:
None

Responses:
### 200
Description: User's entries with role information
Type: object
Body:
  - rows: array
    - items: object & object
  - count: integer
Example response:
```json
{
  "rows": [
    null
  ],
  "count": 1
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

## GET /api/entries/{entryId}
Tag: Entries
Summary: Get entry details by ID

Request parameters:
- entryId (path) | type: integer | required

Request body:
None

Responses:
### 200
Description: Entry details
Type: object
Example response:
```json
{
  "id": 1,
  "categoryId": 1,
  "captainId": 1,
  "name": "string",
  "isAcceptingMembers": false,
  "requiredMemberCount": 1,
  "currentMemberCount": 0,
  "isConfirmed": false,
  "confirmedAt": "2026-05-27T00:00:00Z",
  "category": null,
  "captain": null,
  "members": [
    {
      "id": 1,
      "entryId": 1,
      "userId": 1,
      "eloAtEntry": 1,
      "entry": null,
      "user": null,
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z"
    }
  ],
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

## PUT /api/entries/{entryId}
Tag: Entries
Summary: Update entry information (captain only)

Updateable fields: name, requiredMemberCount, isAcceptingMembers.
Cannot set requiredMemberCount < currentMemberCount or exceed maxMembersPerEntry.

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required

Request body:
Required: yes
Type: object
Fields:
  - name: string
  - requiredMemberCount: integer
  - isAcceptingMembers: boolean
Example payload:
```json
{
  "name": "string",
  "requiredMemberCount": 1,
  "isAcceptingMembers": true
}
```

Responses:
### 200
Description: Entry updated successfully
Type: object
Example response:
```json
{
  "id": 1,
  "categoryId": 1,
  "captainId": 1,
  "name": "string",
  "isAcceptingMembers": false,
  "requiredMemberCount": 1,
  "currentMemberCount": 0,
  "isConfirmed": false,
  "confirmedAt": "2026-05-27T00:00:00Z",
  "category": null,
  "captain": null,
  "members": [
    {
      "id": 1,
      "entryId": 1,
      "userId": 1,
      "eloAtEntry": 1,
      "entry": null,
      "user": null,
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z"
    }
  ],
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

## DELETE /api/entries/{entryId}
Tag: Entries
Summary: Delete entry (captain only, during registration)

Deletes all entry members and join requests. Cannot be undone.

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required

Request body:
None

Responses:
### 204
Request processed successfully, no content returned

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

## GET /api/entries/{entryId}/join-requests
Tag: Entries
Summary: Get join requests for entry (captain only)

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required
- page (query) | type: integer | default: 1
- limit (query) | type: integer | default: 10
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
      - id: integer
      - type: string | required | choices: requested, invited | default: "requested"
      - entryId: integer | required
      - userId: integer | required
      - status: string | required | choices: pending, approved, rejected | default: "pending"
      - rejectionReason: string
      - respondedAt: string
      - entry: object
      - user: object
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
  "joinRequests": [
    {
      "id": 1,
      "type": "requested",
      "entryId": 1,
      "userId": 1,
      "status": "pending",
      "rejectionReason": "string",
      "respondedAt": "2026-05-27T00:00:00Z",
      "entry": null,
      "user": null,
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

## POST /api/entries/{entryId}/transfer-captaincy
Tag: Entries
Summary: Transfer captaincy to another member

New captain must be an existing member of the team.

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required

Request body:
Required: yes
Type: object
Fields:
  - newCaptainId: integer | required
Example payload:
```json
{
  "newCaptainId": 1
}
```

Responses:
### 200
Description: Captaincy transferred successfully
Type: object
Example response:
```json
{
  "id": 1,
  "categoryId": 1,
  "captainId": 1,
  "name": "string",
  "isAcceptingMembers": false,
  "requiredMemberCount": 1,
  "currentMemberCount": 0,
  "isConfirmed": false,
  "confirmedAt": "2026-05-27T00:00:00Z",
  "category": null,
  "captain": null,
  "members": [
    {
      "id": 1,
      "entryId": 1,
      "userId": 1,
      "eloAtEntry": 1,
      "entry": null,
      "user": null,
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z"
    }
  ],
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

## PATCH /api/entries/{entryId}/required-members
Tag: Entries
Summary: Set required member count (captain only, team entries)

count >= currentMemberCount and <= category.maxMembersPerEntry.
Only applicable to "team" category entries.

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required

Request body:
Required: yes
Type: object
Fields:
  - count: integer | required
Example payload:
```json
{
  "count": 1
}
```

Responses:
### 200
Description: Required member count set successfully
Type: object
Example response:
```json
{
  "id": 1,
  "categoryId": 1,
  "captainId": 1,
  "name": "string",
  "isAcceptingMembers": false,
  "requiredMemberCount": 1,
  "currentMemberCount": 0,
  "isConfirmed": false,
  "confirmedAt": "2026-05-27T00:00:00Z",
  "category": null,
  "captain": null,
  "members": [
    {
      "id": 1,
      "entryId": 1,
      "userId": 1,
      "eloAtEntry": 1,
      "entry": null,
      "user": null,
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z"
    }
  ],
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

## POST /api/entries/{entryId}/confirm-lineup
Tag: Entries
Summary: Confirm lineup (captain only)

Locks in the team for competition. Requirements:
currentMemberCount >= requiredMemberCount, during registration window, can only confirm once.

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required

Request body:
None

Responses:
### 200
Description: Lineup confirmed successfully
Type: object
Example response:
```json
{
  "id": 1,
  "categoryId": 1,
  "captainId": 1,
  "name": "string",
  "isAcceptingMembers": false,
  "requiredMemberCount": 1,
  "currentMemberCount": 0,
  "isConfirmed": false,
  "confirmedAt": "2026-05-27T00:00:00Z",
  "category": null,
  "captain": null,
  "members": [
    {
      "id": 1,
      "entryId": 1,
      "userId": 1,
      "eloAtEntry": 1,
      "entry": null,
      "user": null,
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z"
    }
  ],
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

## GET /api/entries/{entryId}/my-role
Tag: Entries
Summary: Get current user's role in a specific entry

Returns "captain", "member", or null if user is not part of this entry.

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required

Request body:
None

Responses:
### 200
Description: User's role in this entry
Type: object
Body:
  - entryId: integer
  - userId: integer
  - role: string | choices: captain, member
Example response:
```json
{
  "entryId": 1,
  "userId": 1,
  "role": "captain"
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
