# Tournament Referees

Tournament referee assignment endpoints

Total endpoints: 9

## POST /api/tournament-referees/invite
Tag: Tournament Referees
Summary: Send invitation to referee

Organizer invites a referee to join tournament

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - tournamentId: integer | required
  - refereeId: integer | required
  - role: string | required | choices: referee, chief
Example payload:
```json
{
  "tournamentId": 1,
  "refereeId": 5,
  "role": "referee"
}
```

Responses:
### 201
Invitation sent successfully

### 400
Bad request

---

## POST /api/tournament-referees/accept-invitation
Tag: Tournament Referees
Summary: Accept referee invitation

Referee accepts an invitation

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - invitationId: integer | required
Example payload:
```json
{
  "invitationId": 1
}
```

Responses:
### 200
Invitation accepted

### 400
Bad request

### 404
Invitation not found

---

## POST /api/tournament-referees/reject-invitation
Tag: Tournament Referees
Summary: Reject referee invitation

Referee rejects an invitation

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - invitationId: integer | required
  - rejectionReason: string
Example payload:
```json
{
  "invitationId": 1,
  "rejectionReason": "Not available at that time"
}
```

Responses:
### 200
Invitation rejected

### 400
Bad request

### 404
Invitation not found

---

## POST /api/tournament-referees/cancel-invitation
Tag: Tournament Referees
Summary: Cancel pending invitation

Organizer cancels a pending invitation

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - invitationId: integer | required
Example payload:
```json
{
  "invitationId": 1
}
```

Responses:
### 200
Invitation cancelled

### 400
Bad request

### 404
Invitation not found

---

## POST /api/tournament-referees/remove
Tag: Tournament Referees
Summary: Remove referee from tournament

Organizer removes a referee from tournament

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - tournamentId: integer | required
  - refereeId: integer | required
Example payload:
```json
{
  "tournamentId": 1,
  "refereeId": 5
}
```

Responses:
### 204
Referee removed

### 400
Bad request

### 404
Not found

---

## POST /api/tournament-referees/update-role
Tag: Tournament Referees
Summary: Update referee role

Organizer updates a referee's role in tournament

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - tournamentId: integer | required
  - refereeId: integer | required
  - newRole: string | required | choices: referee, chief
Example payload:
```json
{
  "tournamentId": 1,
  "refereeId": 5,
  "newRole": "chief"
}
```

Responses:
### 200
Role updated

### 400
Bad request

### 404
Not found

---

## GET /api/tournament-referees/tournament/{tournamentId}
Tag: Tournament Referees
Summary: Get referees by tournament with pagination

Get all referees assigned to a tournament

Request parameters:
- tournamentId (path) | type: integer | required | Tournament ID
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10
- role (query) | type: string | Filter by role | choices: referee, chief

Request body:
None

Responses:
### 200
Description: List of referees with pagination
Type: object
Body:
  - referees: array
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
  "referees": [
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

### 400
Bad request

---

## GET /api/tournament-referees/tournament/{tournamentId}/invitations
Tag: Tournament Referees
Summary: Get invitations by tournament with pagination

Get all referee invitations for a tournament (organizer only)

Auth: bearerAuth

Request parameters:
- tournamentId (path) | type: integer | required | Tournament ID
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10
- status (query) | type: string | Filter by invitation status | choices: pending, accepted, rejected, cancelled, expired

Request body:
None

Responses:
### 200
Description: List of invitations with pagination
Type: object
Body:
  - invitations: array
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
  "invitations": [
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

### 400
Bad request

### 404
Tournament not found

---

## GET /api/tournament-referees/my-invitations
Tag: Tournament Referees
Summary: Get my invitation list

Retrieve all invitations sent to the current referee across all tournaments

Auth: bearerAuth

Request parameters:
- status (query) | type: string | Filter by invitation status | choices: pending, accepted, rejected, cancelled, expired
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10
- sortBy (query) | type: string | Field to sort by | default: createdAt
- sortOrder (query) | type: string | Sort order | choices: ASC, DESC | default: DESC

Request body:
None

Responses:
### 200
Description: List of referee invitations with tournament and organizer details
Type: object
Body:
  - invitations: array
    - items: object
      - id: integer
      - tournamentId: integer
      - refereeId: integer
      - invitedBy: integer
      - role: string | choices: chief, referee
      - status: string | choices: pending, accepted, rejected, cancelled, expired
      - expiresAt: string
      - respondedAt: string
      - rejectionReason: string
      - tournament: object
        - id: integer
        - name: string
        - location: string
        - tier: integer
        - status: string
        - createdBy: integer
      - inviter: object
        - id: integer
        - firstName: string
        - lastName: string
        - email: string
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
  "invitations": [
    {
      "id": 1,
      "tournamentId": 1,
      "refereeId": 1,
      "invitedBy": 1,
      "role": "chief",
      "status": "pending",
      "expiresAt": "2026-05-27T00:00:00Z",
      "respondedAt": "2026-05-27T00:00:00Z",
      "rejectionReason": "string",
      "tournament": {
        "id": 1,
        "name": "string",
        "location": "string",
        "tier": 1,
        "status": "string",
        "createdBy": 1
      },
      "inviter": {
        "id": 1,
        "firstName": "string",
        "lastName": "string",
        "email": "string"
      },
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

### 500
Internal server error

---
