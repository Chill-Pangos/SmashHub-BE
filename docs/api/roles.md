# Roles

Role management endpoints

Total endpoints: 6

## POST /api/roles
Tag: Roles
Summary: Create a new role

Creates a new role with the specified name and description. Requires admin privileges.

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - name: string | required | Unique role name (required, max 50 characters)
  - description: string | Role description and purpose (optional)
Example payload:
```json
{
  "name": "tournament_organizer",
  "description": "Manages tournament creation and participant entries"
}
```

Responses:
### 201
Description: Role created successfully
Type: object
Example response:
```json
{
  "id": 5,
  "name": "tournament_organizer",
  "description": "Manages tournament creation and participant entries",
  "createdAt": "2026-05-28T10:30:00Z",
  "updatedAt": "2026-05-28T10:30:00Z"
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

## GET /api/roles
Tag: Roles
Summary: List all roles with pagination

Retrieves a paginated list of all roles. Requires admin privileges. Results are sorted by creation date in descending order.

Auth: bearerAuth

Request parameters:
- page (query) | type: integer | Page number for pagination (starting from 1) | default: 1
- limit (query) | type: integer | Maximum number of roles to return per page | default: 10

Request body:
None

Responses:
### 200
Description: List of roles with pagination metadata
Type: object
Body:
  - roles: array
    - items: object
      - id: integer
      - name: string | required
      - description: string
      - createdAt: string
      - updatedAt: string
  - pagination: object
    - total: integer | Total number of roles
    - page: integer | Current page number
    - limit: integer | Number of items per page
    - totalPages: integer | Total number of pages
    - hasNextPage: boolean | Whether next page exists
    - hasPrevPage: boolean | Whether previous page exists
Example response:
```json
{
  "roles": [
    {
      "id": 1,
      "name": "admin",
      "description": "Full system access",
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "name": "tournament_organizer",
      "description": "Manages tournament creation and entries",
      "createdAt": "2026-02-15T14:30:00Z",
      "updatedAt": "2026-02-15T14:30:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "hasNextPage": true,
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

## GET /api/roles/{id}
Tag: Roles
Summary: Get role by ID

Retrieves a specific role by its ID. Requires admin privileges.

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Role ID

Request body:
None

Responses:
### 200
Description: Role details retrieved successfully
Type: object
Example response:
```json
{
  "id": 2,
  "name": "tournament_organizer",
  "description": "Manages tournament creation and participant entries",
  "createdAt": "2026-02-15T14:30:00Z",
  "updatedAt": "2026-02-15T14:30:00Z"
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

## PATCH /api/roles/{id}
Tag: Roles
Summary: Update role

Updates an existing role's name and/or description. Requires admin privileges. Role name must be unique.

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Role ID

Request body:
Required: yes
Type: object
Fields:
  - name: string | Updated unique role name (optional, max 50 characters)
  - description: string | Updated role description (optional)
Example payload:
```json
{
  "name": "event_organizer",
  "description": "Manages event planning and tournament coordination"
}
```

Responses:
### 200
Description: Role updated successfully
Type: object
Example response:
```json
{
  "id": 2,
  "name": "event_organizer",
  "description": "Manages event planning and tournament coordination",
  "createdAt": "2026-02-15T14:30:00Z",
  "updatedAt": "2026-05-28T15:45:00Z"
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

## DELETE /api/roles/{id}
Tag: Roles
Summary: Delete role

Permanently deletes a role from the system. Requires admin privileges. This action cannot be undone.

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Role ID

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

## GET /api/roles/name/{name}
Tag: Roles
Summary: Get role by name

Retrieves a specific role by its unique name. Requires admin privileges.

Auth: bearerAuth

Request parameters:
- name (path) | type: string | required | Role name (exact match, case-sensitive)

Request body:
None

Responses:
### 200
Description: Role details retrieved successfully
Type: object
Example response:
```json
{
  "id": 1,
  "name": "admin",
  "description": "Full system access",
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z"
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
