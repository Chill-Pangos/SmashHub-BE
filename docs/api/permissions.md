# Permissions

Permission management endpoints

Total endpoints: 5

## POST /api/permissions
Tag: Permissions
Summary: Create a new permission

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object

Responses:
### 201
Permission created successfully

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

## GET /api/permissions
Tag: Permissions
Summary: Get all permissions

Auth: bearerAuth

Request parameters:
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
List of permissions

---

## GET /api/permissions/{id}
Tag: Permissions
Summary: Get permission by ID

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Permission details

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

## PUT /api/permissions/{id}
Tag: Permissions
Summary: Update permission

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
Permission updated

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

## DELETE /api/permissions/{id}
Tag: Permissions
Summary: Delete permission

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 204
Successfully deleted, no content returned

---
