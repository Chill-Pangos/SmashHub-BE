# Roles

Role management endpoints

Total endpoints: 6

## POST /api/roles
Tag: Roles
Summary: Create a new role

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - name: string
  - description: string
Example payload:
```json
{
  "name": "string",
  "description": "string"
}
```

Responses:
### 201
Role created successfully

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

## GET /api/roles
Tag: Roles
Summary: Get all roles

Auth: bearerAuth

Request parameters:
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
List of roles

---

## GET /api/roles/{id}
Tag: Roles
Summary: Get role by ID

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Role details

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

## PUT /api/roles/{id}
Tag: Roles
Summary: Update role

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Role updated

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

## DELETE /api/roles/{id}
Tag: Roles
Summary: Delete role

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 204
Successfully deleted, no content returned

---

## GET /api/roles/name/{name}
Tag: Roles
Summary: Get role by name

Auth: bearerAuth

Request parameters:
- name (path) | type: string | required

Request body:
None

Responses:
### 200
Role details

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
