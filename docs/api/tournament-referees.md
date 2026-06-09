# Tournament Referees

Tournament referee management endpoints

Total endpoints: 10

## POST /api/tournament-referees/invite
Tag: Tournament Referees
Summary: Send invitation to referee

Organizer invites a referee to join tournament with a specific role.

Key constraints:
- Organizer cannot invite themselves
- Referee must have required system role (referee or chief_referee)
- Referee cannot be competing in the same tournament
- Only 1 chief referee allowed per tournament
- Each referee can only have 1 active invitation per tournament
- Invitation expires after INVITATION_EXPIRY_HOURS (default: 48 hours)

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - tournamentId: integer | required | Tournament ID
  - refereeId: integer | required | User ID of the referee to invite
  - role: string | required | Role for the referee in this tournament | choices: referee, chief
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
Description: Invitation sent successfully
Type: object
Example response:
```json
{
  "id": 1,
  "tournamentId": 1,
  "refereeId": 5,
  "invitedBy": 2,
  "role": "referee",
  "status": "pending",
  "expiresAt": "2024-06-29T12:00:00Z",
  "respondedAt": null,
  "rejectionReason": null,
  "createdAt": "2024-06-27T12:00:00Z",
  "updatedAt": "2024-06-27T12:00:00Z"
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

### 409
Description: Conflict - resource already exists or state conflict
Type: object
Example response:
```json
{
  "message": "Resource already exists"
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

## POST /api/tournament-referees/accept-invitation
Tag: Tournament Referees
Summary: Accept referee invitation

Referee accepts a pending invitation and becomes an active referee for the tournament.

Key behaviors:
- Only pending invitations can be accepted
- Expired invitations are automatically rejected
- Accepts chief role only if no other chief referee exists
- Creates active TournamentReferee record
- Updates invitation status and respondedAt timestamp

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - invitationId: integer | required | ID of the invitation to accept
Example payload:
```json
{
  "invitationId": 1
}
```

Responses:
### 200
Description: Invitation accepted successfully
Type: object
Example response:
```json
{
  "id": 1,
  "tournamentId": 1,
  "refereeId": 5,
  "role": "referee",
  "createdAt": "2024-06-27T12:00:00Z",
  "updatedAt": "2024-06-27T12:00:00Z"
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

### 409
Description: Conflict - resource already exists or state conflict
Type: object
Example response:
```json
{
  "message": "Resource already exists"
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

## POST /api/tournament-referees/reject-invitation
Tag: Tournament Referees
Summary: Reject referee invitation

Referee rejects a pending invitation with optional reason.

Key behaviors:
- Only pending invitations can be rejected
- Expired invitations cannot be manually rejected
- Rejection reason is optional (max 255 characters)
- Updates invitation status and respondedAt timestamp
- Rejected invitations cannot be re-sent (must be cancelled first if organizer wants to reinvite)

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - invitationId: integer | required | ID of the invitation to reject
  - rejectionReason: string | Optional reason for rejection
Example payload:
```json
{
  "invitationId": 1,
  "rejectionReason": "Not available at that time"
}
```

Responses:
### 200
Description: Invitation rejected successfully
Type: object
Example response:
```json
{
  "id": 1,
  "tournamentId": 1,
  "refereeId": 5,
  "invitedBy": 2,
  "role": "referee",
  "status": "rejected",
  "expiresAt": "2024-06-29T12:00:00Z",
  "respondedAt": "2024-06-27T12:30:00Z",
  "rejectionReason": "Not available at that time",
  "createdAt": "2024-06-27T12:00:00Z",
  "updatedAt": "2024-06-27T12:30:00Z"
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

## POST /api/tournament-referees/cancel-invitation
Tag: Tournament Referees
Summary: Cancel pending invitation

Organizer cancels a pending invitation before referee responds.

Key behaviors:
- Only pending invitations can be cancelled
- Only tournament organizer can cancel
- Updates invitation status and respondedAt timestamp
- After cancellation, organizer can send a new invitation to same referee

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - invitationId: integer | required | ID of the invitation to cancel
Example payload:
```json
{
  "invitationId": 1
}
```

Responses:
### 200
Description: Invitation cancelled successfully
Type: object
Example response:
```json
{
  "id": 1,
  "tournamentId": 1,
  "refereeId": 5,
  "invitedBy": 2,
  "role": "referee",
  "status": "cancelled",
  "expiresAt": "2024-06-29T12:00:00Z",
  "respondedAt": "2024-06-27T13:00:00Z",
  "rejectionReason": null,
  "createdAt": "2024-06-27T12:00:00Z",
  "updatedAt": "2024-06-27T13:00:00Z"
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

## POST /api/tournament-referees/remove
Tag: Tournament Referees
Summary: Remove referee from tournament

Organizer removes an active referee from tournament.

Key behaviors:
- Only organizer can remove referees
- Removes from active referees (TournamentReferee record)
- Does not affect past invitations or rejections
- Returns no content on success (204)

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - tournamentId: integer | required | Tournament ID
  - refereeId: integer | required | Referee user ID to remove
Example payload:
```json
{
  "tournamentId": 1,
  "refereeId": 5
}
```

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

## POST /api/tournament-referees/update-role
Tag: Tournament Referees
Summary: Update referee role

Organizer changes a referee's role in tournament (PATCH route but uses POST).

Key constraints:
- Only organizer can update role
- Referee must exist in tournament
- When promoting to chief: must have chief_referee system role and no other chief exists
- Returns updated TournamentReferee record

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - tournamentId: integer | required | Tournament ID
  - refereeId: integer | required | Referee user ID to update
  - newRole: string | required | New role for the referee | choices: referee, chief
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
Description: Role updated successfully
Type: object
Example response:
```json
{
  "id": 1,
  "tournamentId": 1,
  "refereeId": 5,
  "role": "chief",
  "createdAt": "2024-06-27T12:00:00Z",
  "updatedAt": "2024-06-27T13:15:00Z"
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

### 409
Description: Conflict - resource already exists or state conflict
Type: object
Example response:
```json
{
  "message": "Resource already exists"
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

## GET /api/tournament-referees/tournament/{tournamentId}
Tag: Tournament Referees
Summary: Get referees by tournament

Retrieve all active referees assigned to a tournament with optional role filtering.

Features:
- Supports pagination with page/limit query parameters
- Optional role filter (referee or chief)
- Returns referees with basic user information
- Public endpoint (no authentication required)

Request parameters:
- tournamentId (path) | type: integer | required | Tournament ID
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10
- role (query) | type: string | Filter referees by role | choices: referee, chief

Request body:
None

Responses:
### 200
Description: List of referees with pagination
Type: object
Example response:
```json
{
  "referees": [
    {
      "id": 1,
      "tournamentId": 1,
      "refereeId": 5,
      "role": "chief",
      "createdAt": "2024-06-27T12:00:00Z",
      "updatedAt": "2024-06-27T12:00:00Z",
      "referee": {
        "id": 5,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      }
    },
    {
      "id": 2,
      "tournamentId": 1,
      "refereeId": 6,
      "role": "referee",
      "createdAt": "2024-06-27T12:05:00Z",
      "updatedAt": "2024-06-27T12:05:00Z",
      "referee": {
        "id": 6,
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com"
      }
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
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

## GET /api/tournament-referees/tournament/{tournamentId}/invitations
Tag: Tournament Referees
Summary: Get invitations by tournament

Retrieve all referee invitations for a tournament (organizer only).

Features:
- Organizer can track pending, accepted, rejected, cancelled, and expired invitations
- Supports pagination with page/limit query parameters
- Optional status filter
- Returns invitation details with invited referee information
- Only accessible to tournament organizer

Auth: bearerAuth

Request parameters:
- tournamentId (path) | type: integer | required | Tournament ID
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10
- status (query) | type: string | Filter invitations by status | choices: pending, accepted, rejected, cancelled, expired

Request body:
None

Responses:
### 200
Description: List of invitations with pagination
Type: object
Example response:
```json
{
  "invitations": [
    {
      "id": 1,
      "tournamentId": 1,
      "refereeId": 5,
      "invitedBy": 2,
      "role": "chief",
      "status": "pending",
      "expiresAt": "2024-06-29T12:00:00Z",
      "respondedAt": null,
      "rejectionReason": null,
      "createdAt": "2024-06-27T12:00:00Z",
      "updatedAt": "2024-06-27T12:00:00Z",
      "referee": {
        "id": 5,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
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

## GET /api/tournament-referees/tournament/{tournamentId}/available
Tag: Tournament Referees
Summary: Get referees available for invitation

Retrieve referee users who can be invited to this tournament.

A referee is available only when:
- Has referee or chief_referee system role
- Is not organizer of this tournament
- Is not competing in this tournament
- Is not already assigned/invited to this tournament
- Is not assigned to another non-cancelled tournament whose schedule overlaps this tournament

Auth: bearerAuth

Request parameters:
- tournamentId (path) | type: integer | required | Tournament ID
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10
- role (query) | type: string | Filter by system role. referee includes chief_referee users too. | choices: referee, chief_referee
- search (query) | type: string | Search by firstName, lastName, or email

Request body:
None

Responses:
### 200
Description: Available referees with pagination
Type: object
Body:
  - referees: array
    - items: object
      - id: integer | User ID
      - firstName: string | required | User first name
      - lastName: string | required | User last name
      - email: string | required | User email address
      - password: string | required | Hashed password
      - isEmailVerified: boolean | Whether the email is verified | default: false
      - gender: string | User gender | choices: male, female, other
      - avatarUrl: string | URL to user avatar image
      - dob: string | Date of birth
      - phoneNumber: string | User phone number
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
  "referees": [
    {
      "id": 1,
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "password": "string",
      "isEmailVerified": false,
      "gender": "male",
      "avatarUrl": "string",
      "dob": "2026-05-27",
      "phoneNumber": "string",
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

## GET /api/tournament-referees/my-invitations
Tag: Tournament Referees
Summary: Get my invitations

Retrieve all referee invitations sent to the current user across all tournaments.

Features:
- Personal invitation list for authenticated referee
- Includes complete tournament and organizer information
- Supports filtering by invitation status (pending, accepted, rejected, cancelled, expired)
- Supports pagination and sorting (createdAt, status, role, etc.)
- Shows expiration details and rejection reasons (if applicable)
- Useful for referee to track pending invitations and respond to them

Status meanings:
- pending: Awaiting referee response, expires after INVITATION_EXPIRY_HOURS (48 hours)
- accepted: Referee accepted and is now active in tournament
- rejected: Referee rejected the invitation
- cancelled: Organizer cancelled the pending invitation
- expired: Invitation expired without response

Auth: bearerAuth

Request parameters:
- status (query) | type: string | Filter by invitation status | choices: pending, accepted, rejected, cancelled, expired
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10
- sortBy (query) | type: string | Field to sort by | choices: createdAt, status, role, expiresAt | default: createdAt
- sortOrder (query) | type: string | Sort order (ascending or descending) | choices: ASC, DESC | default: DESC

Request body:
None

Responses:
### 200
Description: List of referee invitations with tournament and organizer details
Type: object
Example response:
```json
{
  "invitations": [
    {
      "id": 1,
      "tournamentId": 1,
      "refereeId": 5,
      "invitedBy": 2,
      "role": "referee",
      "status": "pending",
      "expiresAt": "2024-06-29T12:00:00Z",
      "respondedAt": null,
      "rejectionReason": null,
      "tournament": {
        "id": 1,
        "name": "Summer Championship 2024",
        "location": "New York",
        "tier": 2,
        "status": "registration_open",
        "createdBy": 2
      },
      "inviter": {
        "id": 2,
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@example.com"
      },
      "createdAt": "2024-06-27T12:00:00Z",
      "updatedAt": "2024-06-27T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
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
Description: Internal server error
Type: object
Example response:
```json
{
  "message": "Internal server error"
}
```

---
