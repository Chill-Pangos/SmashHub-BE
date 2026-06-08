# Entry Members

Total endpoints: 6

## GET /api/entries/{entryId}/members
Tag: Entry Members
Summary: Get all members of entry with pagination

Request parameters:
- entryId (path) | type: integer | required
- page (query) | type: integer | default: 1
- limit (query) | type: integer | default: 10

Request body:
None

Responses:
### 200
Description: List of team members with pagination
Type: object
Body:
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

## POST /api/entries/{entryId}/members/invite
Tag: Entry Members
Summary: Invite a user to join the team (captain only)

Captain sends an invitation to a user. The user must confirm before being added.
User must be eligible (gender, age, ELO), not already registered in category,
team must not be full, registration window must be open.

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required

Request body:
Required: yes
Type: object
Fields:
  - inviteeId: integer | required
Example payload:
```json
{
  "inviteeId": 1
}
```

Responses:
### 201
Description: Invitation created successfully
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

## POST /api/entries/{entryId}/members/invitations/{invitationId}/accept
Tag: Entry Members
Summary: Accept an invitation to join the team (invitee only)

Invited user accepts the invitation. Eligibility is re-checked at this point.
User is added to the team immediately upon acceptance.

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required
- invitationId (path) | type: integer | required

Request body:
None

Responses:
### 201
Description: Invitation accepted, member added to team
Type: object
Example response:
```json
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

## POST /api/entries/{entryId}/members/invitations/{invitationId}/reject
Tag: Entry Members
Summary: Reject an invitation to join the team (invitee only)

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required
- invitationId (path) | type: integer | required

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

## DELETE /api/entries/{entryId}/members/me
Tag: Entry Members
Summary: Leave entry (member only)

Leave a team as a member during the registration period.
Captain cannot leave (must transfer captaincy or delete entry).
Automatically reopens team for new members if it was full.

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

## DELETE /api/entries/{entryId}/members/{memberId}
Tag: Entry Members
Summary: Remove member from entry (captain only)

Captain removes a member during registration period.
Cannot remove the captain. Automatically reopens team if it was full.

Auth: bearerAuth

Request parameters:
- entryId (path) | type: integer | required
- memberId (path) | type: integer | required

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
