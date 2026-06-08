# Role Permissions

Role-permission mapping endpoints

Total endpoints: 6

## POST /api/role-permissions
Tag: Role Permissions
Summary: Assign permission to role

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - roleId: number
  - permissionId: number
Example payload:
```json
{
  "roleId": 1,
  "permissionId": 1
}
```

Responses:
### 201
Permission assigned to role

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

## GET /api/role-permissions
Tag: Role Permissions
Summary: Get all role-permission assignments

Auth: bearerAuth

Request parameters:
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
List of role-permission assignments

---

## GET /api/role-permissions/role/{roleId}
Tag: Role Permissions
Summary: Get permissions for a role

Auth: bearerAuth

Request parameters:
- roleId (path) | type: number | required
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
Permissions assigned to role

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

## GET /api/role-permissions/permission/{permissionId}
Tag: Role Permissions
Summary: Get roles that have a permission

Auth: bearerAuth

Request parameters:
- permissionId (path) | type: number | required
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
Roles with the permission

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

## GET /api/role-permissions/check
Tag: Role Permissions
Summary: Check if role has permission

Auth: bearerAuth

Request parameters:
- roleId (query) | type: number | required
- permissionId (query) | type: number | required

Request body:
None

Responses:
### 200
Permission status

---

## DELETE /api/role-permissions/{roleId}/{permissionId}
Tag: Role Permissions
Summary: Remove permission from role

Auth: bearerAuth

Request parameters:
- roleId (path) | type: number | required
- permissionId (path) | type: number | required

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
