# Users

User management endpoints

Total endpoints: 9

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
  - dob: string
  - phoneNumber: string
  - gender: string | choices: male, female
Example payload:
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
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
  "users": [
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
Description: Current user profile with roles and ELO score
Type: object
Example response:
```json
{
  "id": 1,
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "isEmailVerified": true,
  "gender": "male",
  "avatarUrl": "string",
  "dob": "2026-05-27",
  "phoneNumber": "string",
  "roles": [
    {
      "id": 1,
      "name": "string",
      "description": "string",
      "createdAt": "2026-05-27T00:00:00Z",
      "updatedAt": "2026-05-27T00:00:00Z"
    }
  ],
  "eloScore": null,
  "createdAt": "2026-05-27T00:00:00Z",
  "updatedAt": "2026-05-27T00:00:00Z"
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

---

## GET /api/users/search
Tag: Users
Summary: Search users by name

Request parameters:
- name (query) | type: string | First name, last name, or full name to search for
- page (query) | type: integer | Page number for pagination | default: 1
- limit (query) | type: integer | Maximum number of records to return | default: 10

Request body:
None

Responses:
### 200
List of matching users with pagination

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
Description: User details
Type: object
Example response:
```json
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

---

## PUT /api/users/{id}
Tag: Users
Summary: Update user (admin)

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
  - dob: string
  - phoneNumber: string
  - gender: string | choices: male, female
Example payload:
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
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
Summary: Update user profile fields

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
Required: yes
Type: object
Fields:
  - dob: string
  - phoneNumber: string
  - gender: string | choices: male, female
Example payload:
```json
{
  "dob": "1995-08-20",
  "phoneNumber": "+84901234567",
  "gender": "male"
}
```

Responses:
### 200
Description: Profile updated successfully
Type: object
Example response:
```json
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

---

## POST /api/users/{id}/avatar
Tag: Users
Summary: Upload user avatar

Upload image file. Auto-resized to 256x256 and converted to WebP.

Auth: bearerAuth

Request parameters:
- id (path) | type: integer | required | Resource ID

Request body:
Required: yes
Type: object
Fields:
  - avatar: string | required | Image file (jpeg, jpg, png, webp). Max 5MB.
Example payload:
```json
{
  "avatar": "string"
}
```

Responses:
### 200
Description: Avatar uploaded successfully
Type: object
Body:
  - avatarUrl: string
Example response:
```json
{
  "avatarUrl": "/uploads/avatars/a1b2c3d4.webp"
}
```

### 400
No file uploaded or invalid file type

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

---
