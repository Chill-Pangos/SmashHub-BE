# User Roles

User role assignment endpoints

Total endpoints: 6

## POST /api/user-roles
Tag: User Roles
Summary: Assign role to user

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - userId: number
  - roleId: number
Example payload:
```json
{
  "userId": 1,
  "roleId": 1
}
```

Responses:
### 201
Role assigned to user

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

## GET /api/user-roles
Tag: User Roles
Summary: Get all user-role assignments

Auth: bearerAuth

Request parameters:
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
List of user-role assignments

---

## GET /api/user-roles/user/{userId}
Tag: User Roles
Summary: Get roles for a user

Auth: bearerAuth

Request parameters:
- userId (path) | type: number | required
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
Roles assigned to user

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

## GET /api/user-roles/role/{roleId}
Tag: User Roles
Summary: Get users that have a role

Auth: bearerAuth

Request parameters:
- roleId (path) | type: number | required
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
Users with the role

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

## GET /api/user-roles/check
Tag: User Roles
Summary: Check if user has role

Auth: bearerAuth

Request parameters:
- userId (query) | type: number | required
- roleId (query) | type: number | required

Request body:
None

Responses:
### 200
Role status

---

## DELETE /api/user-roles/{userId}/{roleId}
Tag: User Roles
Summary: Remove role from user

Auth: bearerAuth

Request parameters:
- userId (path) | type: number | required
- roleId (path) | type: number | required

Request body:
None

Responses:
### 204
Successfully deleted, no content returned

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
