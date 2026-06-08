# Role Permissions

Role permission assignment endpoints

Total endpoints: 6

## POST /api/role-permissions
Tag: Role Permissions
Summary: Assign permission to role

Create a many-to-many relationship between a role and a permission.
This endpoint allows admins to grant permissions to specific roles.
Only administrators can assign permissions to roles.
Each role-permission combination must be unique (duplicate assignments are rejected with 409 Conflict).

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - roleId: integer | required | ID of the role to assign the permission to
  - permissionId: integer | required | ID of the permission to assign
Example payload:
```json
{
  "roleId": 1,
  "permissionId": 5
}
```

Responses:
### 201
Description: Permission successfully assigned to role
Type: object
Example response:
```json
{
  "id": 123,
  "roleId": 1,
  "permissionId": 5,
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

### 404
Description: Role or permission not found
Type: object
Example response:
```json
{
  "message": "string"
}
```

### 409
Description: Permission already assigned to role
Type: object
Example response:
```json
{
  "message": "Permission already assigned to role"
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

## GET /api/role-permissions
Tag: Role Permissions
Summary: List all role-permission assignments

Retrieve all role-permission relationships with pagination.
Returns assignments with associated role and permission details.
Only administrators can view all assignments.

Auth: bearerAuth

Request parameters:
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
Description: List of role-permission assignments with pagination
Type: object
Body:
  - rolePermissions: array
    - items: object
      - roleId: integer | required
      - permissionId: integer | required
      - createdAt: string
      - updatedAt: string
      - id: integer
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
  "rolePermissions": [
    {
      "id": 123,
      "roleId": 1,
      "permissionId": 5,
      "role": {
        "id": 1,
        "name": "admin"
      },
      "permission": {
        "id": 5,
        "name": "create_tournament"
      },
      "createdAt": "2026-05-28T10:30:00Z",
      "updatedAt": "2026-05-28T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
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

## GET /api/role-permissions/role/{roleId}
Tag: Role Permissions
Summary: Get permissions for a role

Retrieve all permissions assigned to a specific role with pagination.
This helps understand what actions a role can perform in the system.
Only administrators can query role permissions.

Auth: bearerAuth

Request parameters:
- roleId (path) | type: integer | required | ID of the role to query
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
Description: Permissions assigned to the role
Type: object
Body:
  - rolePermissions: array
    - items: object
      - roleId: integer | required
      - permissionId: integer | required
      - createdAt: string
      - updatedAt: string
      - id: integer
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
  "rolePermissions": [
    {
      "id": 123,
      "roleId": 1,
      "permissionId": 5,
      "permission": {
        "id": 5,
        "name": "create_tournament"
      },
      "createdAt": "2026-05-28T10:30:00Z",
      "updatedAt": "2026-05-28T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "totalPages": 2,
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

### 404
Description: Role not found
Type: object
Example response:
```json
{
  "message": "Role not found"
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

## GET /api/role-permissions/permission/{permissionId}
Tag: Role Permissions
Summary: Get roles with a permission

Retrieve all roles that have been granted a specific permission with pagination.
This helps identify which roles can perform a particular action in the system.
Only administrators can query role assignments by permission.

Auth: bearerAuth

Request parameters:
- permissionId (path) | type: integer | required | ID of the permission to query
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
Description: Roles that have the specified permission
Type: object
Body:
  - rolePermissions: array
    - items: object
      - roleId: integer | required
      - permissionId: integer | required
      - createdAt: string
      - updatedAt: string
      - id: integer
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
  "rolePermissions": [
    {
      "id": 123,
      "roleId": 1,
      "permissionId": 5,
      "role": {
        "id": 1,
        "name": "admin"
      },
      "createdAt": "2026-05-28T10:30:00Z",
      "updatedAt": "2026-05-28T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 3,
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
Description: Permission not found
Type: object
Example response:
```json
{
  "message": "Permission not found"
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

## GET /api/role-permissions/check
Tag: Role Permissions
Summary: Check if role has permission

Verify whether a specific role has been granted a particular permission.
Returns a boolean result indicating the permission status.
Useful for validation and authorization checking.

Auth: bearerAuth

Request parameters:
- roleId (query) | type: integer | required | ID of the role to check
- permissionId (query) | type: integer | required | ID of the permission to check

Request body:
None

Responses:
### 200
Description: Permission status check result
Type: object
Body:
  - hasPermission: boolean | Whether the role has the specified permission
Example response:
```json
{
  "hasPermission": true
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

## DELETE /api/role-permissions/{roleId}/{permissionId}
Tag: Role Permissions
Summary: Remove permission from role

Revoke a permission from a role by deleting the many-to-many relationship.
This prevents the role from performing the specified action.
Only administrators can remove permissions from roles.
Returns 204 No Content on successful deletion.

Auth: bearerAuth

Request parameters:
- roleId (path) | type: integer | required | ID of the role
- permissionId (path) | type: integer | required | ID of the permission to remove

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
Description: Role-permission assignment not found
Type: object
Example response:
```json
{
  "message": "Role-permission assignment not found"
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
