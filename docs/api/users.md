# Users

User management endpoints

Total endpoints: 7

## POST /api/users
Tag: Users
Summary: Create a new user

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - firstName: string | required
  - lastName: string | required
  - email: string | required
  - password: string | required
  - avatarUrl: string
  - dob: string
  - phoneNumber: string
  - gender: string | choices: male, female, other
Example payload:
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "avatarUrl": "string",
  "dob": "2026-05-27",
  "phoneNumber": "string",
  "gender": "male"
}
```

Responses:
### 201
User created successfully

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

## GET /api/users
Tag: Users
Summary: Get all users with pagination

Request parameters:
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
Description: List of users with pagination
Type: object
Body:
  - users: array
    - items: object
      - id: integer
      - firstName: string
      - lastName: string
      - email: string
      - avatarUrl: string
      - dob: string
      - phoneNumber: string
      - gender: string
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
  "users": [
    {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "avatarUrl": "string",
      "dob": "2026-05-27",
      "phoneNumber": "string",
      "gender": "string",
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
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

## GET /api/users/me
Tag: Users
Summary: Get current authenticated user

Auth: bearerAuth

Request parameters:
None

Request body:
None

Responses:
### 200
Current user profile with roles and ELO score

### 401
Description: Authentication required or token invalid
Type: object
Example response:
```json
{
  "message": "Unauthorized access"
}
```

---

## GET /api/users/{id}
Tag: Users
Summary: Get user by ID

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
None

Responses:
### 200
User details

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

## PUT /api/users/{id}
Tag: Users
Summary: Update user

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
Required: yes
Type: object
Fields:
  - firstName: string
  - lastName: string
  - email: string
  - password: string
  - avatarUrl: string
  - dob: string
  - phoneNumber: string
  - gender: string | choices: male, female, other
Example payload:
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "avatarUrl": "string",
  "dob": "2026-05-27",
  "phoneNumber": "string",
  "gender": "male"
}
```

Responses:
### 200
User updated successfully

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

## DELETE /api/users/{id}
Tag: Users
Summary: Delete user

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

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

## PUT /api/users/{id}/profile
Tag: Users
Summary: Update user profile (avatarUrl, dob, phoneNumber, gender)

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
Required: yes
Type: object
Fields:
  - avatarUrl: string
  - dob: string
  - phoneNumber: string
  - gender: string | choices: male, female, other
Example payload:
```json
{
  "avatarUrl": "string",
  "dob": "2026-05-27",
  "phoneNumber": "string",
  "gender": "male"
}
```

Responses:
### 200
User profile updated successfully

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
