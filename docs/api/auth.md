# Auth

Authentication and token lifecycle endpoints

Total endpoints: 11

## POST /api/auth/register
Tag: Auth
Summary: Register new user

Create a new user account. Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character.

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - firstName: string | required | User first name
  - lastName: string | required | User last name
  - email: string | required | Valid email address
  - password: string | required | Password (min 8 chars, 1 uppercase, 1 number, 1 special character)
  - role: string | User role (defaults to spectator if not specified)
Example payload:
```json
{
  "firstName": "Nguyen",
  "lastName": "Van A",
  "email": "user@test.com",
  "password": "Password123!",
  "role": "spectator"
}
```

Responses:
### 201
Description: User registered successfully
Type: object
Body:
  - success: boolean
  - message: string
  - data: object
    - user: object
      - id: integer
      - firstName: string
      - lastName: string
      - email: string
      - roles: array
        - items: integer
      - isEmailVerified: boolean
    - accessToken: string
    - refreshToken: string
Example response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "firstName": "Nguyen",
      "lastName": "Van A",
      "email": "user@test.com",
      "roles": [
        8
      ],
      "isEmailVerified": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 400
Description: Invalid input or user already exists
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Registration failed"
}
```

---

## POST /api/auth/login
Tag: Auth
Summary: Login user

Authenticate with email and password. Email must be in valid format.

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - email: string | required | Valid email address
  - password: string | required | Account password
Example payload:
```json
{
  "email": "user@test.com",
  "password": "Password123!"
}
```

Responses:
### 200
Description: Login successful
Type: object
Body:
  - success: boolean
  - message: string
  - data: object
    - accessToken: string
    - refreshToken: string
    - user: object
      - id: integer
      - firstName: string
      - lastName: string
      - email: string
      - isEmailVerified: boolean
Example response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "firstName": "Nguyen",
      "lastName": "Van A",
      "email": "user@test.com",
      "isEmailVerified": false
    }
  }
}
```

### 401
Description: Invalid credentials
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Login failed"
}
```

---

## POST /api/auth/refresh
Tag: Auth
Summary: Refresh access token

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - refreshToken: string | required
Example payload:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Responses:
### 200
Description: Token refreshed successfully
Type: object
Body:
  - success: boolean
  - message: string
  - data: object
    - accessToken: string
    - refreshToken: string
Example response:
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 401
Description: Invalid or expired refresh token
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Token refresh failed"
}
```

---

## POST /api/auth/change-password
Tag: Auth
Summary: Change password

Change user password. New password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character.

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - oldPassword: string | required | Current password
  - newPassword: string | required | New password (min 8 chars, 1 uppercase, 1 number, 1 special character)
Example payload:
```json
{
  "oldPassword": "Password123!",
  "newPassword": "NewStrongPass456!"
}
```

Responses:
### 200
Description: Password changed successfully
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### 400
Description: Invalid old password or weak new password
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Failed to change password"
}
```

### 401
Description: Unauthorized - Invalid or missing token
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

## POST /api/auth/logout
Tag: Auth
Summary: Logout user - blacklist all tokens

Auth: bearerAuth

Request parameters:
None

Request body:
None

Responses:
### 200
Description: Logout successful
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### 401
Description: Unauthorized - Invalid or missing token
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

## POST /api/auth/forgot-password
Tag: Auth
Summary: Request password reset - Send OTP to email

Request a password reset OTP. Email must be in valid format.

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - email: string | required | Valid email address to receive OTP
Example payload:
```json
{
  "email": "user@test.com"
}
```

Responses:
### 200
Description: OTP sent successfully
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": true,
  "message": "OTP has been sent to your email"
}
```

### 400
Description: Failed to send OTP
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "User not found with this email"
}
```

---

## POST /api/auth/reset-password
Tag: Auth
Summary: Reset password with verified OTP

Reset password using OTP. New password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character. Email must be in valid format.

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - email: string | required | Valid email address
  - otp: string | required | Verified 6-digit OTP code
  - newPassword: string | required | New password (min 8 chars, 1 uppercase, 1 number, 1 special character)
Example payload:
```json
{
  "email": "user@test.com",
  "otp": "123456",
  "newPassword": "NewPassword123!"
}
```

Responses:
### 200
Description: Password reset successfully
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

### 400
Description: Failed to reset password
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Invalid OTP"
}
```

---

## POST /api/auth/send-email-verification-otp
Tag: Auth
Summary: Send email verification OTP

Sends a 6-digit OTP to the user's email for email verification

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - email: string | required | Email address to verify
Example payload:
```json
{
  "email": "user@test.com"
}
```

Responses:
### 200
Description: OTP sent successfully
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": true,
  "message": "Mã OTP xác thực đã được gửi đến email của bạn"
}
```

### 400
Description: Failed to send OTP
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Không tìm thấy người dùng với email này"
}
```

---

## POST /api/auth/verify-email-otp
Tag: Auth
Summary: Verify email with OTP

Verifies the user's email address using the OTP sent via email

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - email: string | required
  - otp: string | required | 6-digit OTP code received via email
Example payload:
```json
{
  "email": "user@test.com",
  "otp": "123456"
}
```

Responses:
### 200
Description: Email verified successfully
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": true,
  "message": "Email đã được xác thực thành công"
}
```

### 400
Description: Email verification failed
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Mã OTP không hợp lệ hoặc đã hết hạn"
}
```

---

## POST /api/auth/resend-email-verification-otp
Tag: Auth
Summary: Resend email verification OTP

Resends a new 6-digit OTP to the user's email for email verification

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - email: string | required | Email address to resend OTP to
Example payload:
```json
{
  "email": "user@test.com"
}
```

Responses:
### 200
Description: OTP resent successfully
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": true,
  "message": "Mã OTP mới đã được gửi lại đến email của bạn"
}
```

### 400
Description: Failed to resend OTP
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Không thể gửi lại mã OTP"
}
```

---
