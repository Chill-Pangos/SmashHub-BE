# Auth

Authentication and authorization endpoints

Total endpoints: 11

## POST /api/auth/register
Tag: Auth
Summary: Register new user account

Create a new user account. Email must be unique and in valid format. Password must be at least 8 characters, contain 1 uppercase letter, 1 number, and 1 special character (!@#$%^&*()_+-=[]{}';:"|,.<>/?\\). User is assigned 'spectator' role by default unless specified otherwise. Email verification is required after registration.

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - firstName: string | required | User first name (required, non-empty)
  - lastName: string | required | User last name (required, non-empty)
  - email: string | required | Valid email address (must be unique, RFC 5322 format)
  - password: string | required | Strong password (min 8 chars, 1 uppercase, 1 digit, 1 special char)
  - role: string | User role name (defaults to 'spectator' if not provided)
Example payload:
```json
{
  "firstName": "Nguyễn",
  "lastName": "Văn A",
  "email": "nguyenvana@example.com",
  "password": "SecurePass123!",
  "role": "spectator"
}
```

Responses:
### 201
Description: User registered successfully with tokens and user details
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
      - roles: array | Array of role IDs assigned to user
        - items: integer
      - isEmailVerified: boolean | Email verification status (false until verified via OTP)
    - accessToken: string | JWT access token for authenticated requests
    - refreshToken: string | JWT refresh token for obtaining new access tokens
Example response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 42,
      "firstName": "Nguyễn",
      "lastName": "Văn A",
      "email": "nguyenvana@example.com",
      "roles": [
        8
      ],
      "isEmailVerified": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQyLCJpYXQiOjE3MTk2NTMyOTUsImV4cCI6MTcxOTY1Njg5NX0.ABC123...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQyLCJpYXQiOjE3MTk2NTMyOTUsImV4cCI6MTcyMDI1ODI5NX0.XYZ789..."
  }
}
```

### 400
Description: Invalid input - validation error or email already exists
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Email already exists or Password does not meet requirements"
}
```

### 500
Description: Internal server error during registration
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## POST /api/auth/login
Tag: Auth
Summary: Authenticate user and obtain tokens

Login with email and password. User must have a verified email to login. Returns access and refresh tokens for authenticated requests. Invalidates all previous tokens for security.

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - email: string | required | Registered email address (RFC 5322 format)
  - password: string | required | Account password
Example payload:
```json
{
  "email": "nguyenvana@example.com",
  "password": "SecurePass123!"
}
```

Responses:
### 200
Description: Login successful with user data and tokens
Type: object
Body:
  - success: boolean
  - message: string
  - data: object
    - accessToken: string | JWT access token (short-lived, typically ~1 hour)
    - refreshToken: string | JWT refresh token (long-lived, for getting new access tokens)
    - user: object
      - id: integer
      - firstName: string
      - lastName: string
      - email: string
      - roles: array | Array of assigned role IDs
        - items: integer
      - isEmailVerified: boolean | Email verification status
Example response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQyLCJpYXQiOjE3MTk2NTMyOTUsImV4cCI6MTcxOTY1Njg5NX0.ABC123...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQyLCJpYXQiOjE3MTk2NTMyOTUsImV4cCI6MTcyMDI1ODI5NX0.XYZ789...",
    "user": {
      "id": 42,
      "firstName": "Nguyễn",
      "lastName": "Văn A",
      "email": "nguyenvana@example.com",
      "roles": [
        8
      ],
      "isEmailVerified": true
    }
  }
}
```

### 400
Description: Invalid email format
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Invalid email format"
}
```

### 401
Description: Invalid credentials or email not verified
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Email is not verified or Invalid credentials"
}
```

### 500
Description: Internal server error during login
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## POST /api/auth/refresh
Tag: Auth
Summary: Obtain new access token using refresh token

Use a valid refresh token to obtain a new access token and refresh token. The old refresh token will be invalidated for security. Refresh tokens are long-lived but single-use.

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - refreshToken: string | required | Valid JWT refresh token from login or previous refresh
Example payload:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQyLCJpYXQiOjE3MTk2NTMyOTUsImV4cCI6MTcyMDI1ODI5NX0.XYZ789..."
}
```

Responses:
### 200
Description: Token refreshed successfully with new tokens
Type: object
Body:
  - success: boolean
  - message: string
  - data: object
    - accessToken: string | New JWT access token
    - refreshToken: string | New JWT refresh token
Example response:
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQyLCJpYXQiOjE3MTk2NTMyOTUsImV4cCI6MTcxOTY1Njg5NX0.ABC123...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQyLCJpYXQiOjE3MTk2NTMyOTUsImV4cCI6MTcyMDI1ODI5NX0.XYZ789..."
  }
}
```

### 400
Description: Missing or invalid refresh token format
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Refresh token is required"
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
  "message": "Invalid or expired refresh token"
}
```

### 500
Description: Internal server error during token refresh
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## POST /api/auth/change-password
Tag: Auth
Summary: Change user password (authenticated)

Change the current user's password. Requires valid authentication token. Old password must be verified. New password must be at least 8 characters, contain 1 uppercase letter, 1 number, and 1 special character, and must be different from old password.

Auth: bearerAuth

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - oldPassword: string | required | Current password for verification
  - newPassword: string | required | New password (min 8 chars, 1 uppercase, 1 digit, 1 special char, must differ from old)
Example payload:
```json
{
  "oldPassword": "OldPass123!",
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
Description: Invalid old password, weak new password, or password is same as old
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Old password is incorrect or new password does not meet requirements"
}
```

### 401
Description: Unauthorized - Invalid, expired, or missing authentication token
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

### 500
Description: Internal server error during password change
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## POST /api/auth/logout
Tag: Auth
Summary: Logout user (authenticated)

Logout the current authenticated user. Invalidates all active tokens for this user. No request body required - user ID is extracted from the authentication token.

Auth: bearerAuth

Request parameters:
None

Request body:
None

Responses:
### 200
Description: Logout successful - all user tokens have been invalidated
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
Description: Unauthorized - Invalid, expired, or missing authentication token
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

### 500
Description: Internal server error during logout
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## POST /api/auth/forgot-password
Tag: Auth
Summary: Request password reset - Send OTP to email

Request a password reset by sending a 6-digit OTP code to the registered email address. OTP expires in 5 minutes. Any existing unused OTPs for this user are invalidated. Email must be in valid format.

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - email: string | required | Registered email address to receive password reset OTP
Example payload:
```json
{
  "email": "nguyenvana@example.com"
}
```

Responses:
### 200
Description: OTP sent successfully to email
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
Description: Invalid email format or user not found
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Invalid email format or user not found"
}
```

### 500
Description: Failed to send OTP email or internal server error
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Failed to send OTP"
}
```

---

## POST /api/auth/verify-otp
Tag: Auth
Summary: Verify password reset OTP code

Verify the 6-digit OTP code sent to email for password reset. OTP must be valid and not expired (5 minute expiry). Verification does not reset the password - only checks OTP validity. Use /auth/reset-password to actually reset password with OTP.

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - email: string | required | Email address associated with the OTP
  - otp: string | required | 6-digit numeric OTP code received via email
Example payload:
```json
{
  "email": "nguyenvana@example.com",
  "otp": "123456"
}
```

Responses:
### 200
Description: OTP verified successfully
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

### 400
Description: Invalid email format, invalid OTP, or expired OTP
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Invalid OTP or OTP has expired"
}
```

### 500
Description: Internal server error during OTP verification
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## POST /api/auth/reset-password
Tag: Auth
Summary: Reset password with verified OTP

Reset user password using a verified OTP code. OTP must be valid and not expired. New password must be at least 8 characters, contain 1 uppercase letter, 1 number, and 1 special character, and must be different from the current password. All existing tokens are invalidated for security after password reset.

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - email: string | required | Email address associated with the password reset request
  - otp: string | required | Valid 6-digit OTP code from /auth/forgot-password
  - newPassword: string | required | New password (min 8 chars, 1 uppercase, 1 digit, 1 special char, must differ from old)
Example payload:
```json
{
  "email": "nguyenvana@example.com",
  "otp": "123456",
  "newPassword": "NewPassword456!"
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
Description: Invalid email format, invalid/expired OTP, weak password, or password same as old
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Invalid OTP, new password does not meet requirements, or password is same as current"
}
```

### 500
Description: Internal server error during password reset
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## POST /api/auth/send-email-verification-otp
Tag: Auth
Summary: Send email verification OTP

Send a 6-digit OTP code to the user's email for email verification. Can only be sent to unverified emails. OTP expires in 5 minutes. Any existing unused OTPs for this user are invalidated. Email must be in valid format.

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - email: string | required | Email address to verify (must not be already verified)
Example payload:
```json
{
  "email": "nguyenvana@example.com"
}
```

Responses:
### 200
Description: Verification OTP sent successfully to email
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": true,
  "message": "Verification OTP has been sent to your email"
}
```

### 400
Description: Invalid email format, user not found, or email already verified
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Email already verified or Invalid email format"
}
```

### 500
Description: Failed to send OTP email or internal server error
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Failed to send verification OTP"
}
```

---

## POST /api/auth/verify-email-otp
Tag: Auth
Summary: Verify email with OTP

Verify the user's email address using the 6-digit OTP code sent via email. OTP must be valid and not expired (5 minute expiry). After successful verification, user's email is marked as verified and can login.

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - email: string | required | Email address being verified
  - otp: string | required | 6-digit numeric OTP code received via email
Example payload:
```json
{
  "email": "nguyenvana@example.com",
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
  "message": "Email has been verified successfully"
}
```

### 400
Description: Email verification failed - invalid email, OTP, or expired OTP
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Invalid OTP or OTP has expired"
}
```

### 500
Description: Internal server error during email verification
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## POST /api/auth/resend-email-verification-otp
Tag: Auth
Summary: Resend email verification OTP

Resend a new 6-digit OTP code to the user's email for email verification. Can be used if the previous OTP expired or was not received. Any existing unused OTPs for this email are invalidated. OTP expires in 5 minutes. Email must be in valid format and not already verified.

Request parameters:
None

Request body:
Required: yes
Type: object
Fields:
  - email: string | required | Email address to resend OTP to (must not be already verified)
Example payload:
```json
{
  "email": "nguyenvana@example.com"
}
```

Responses:
### 200
Description: New verification OTP resent successfully to email
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": true,
  "message": "A new OTP code has been sent to your email"
}
```

### 400
Description: Invalid email format, user not found, or email already verified
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Email already verified or Invalid email format"
}
```

### 500
Description: Failed to resend OTP email or internal server error
Type: object
Body:
  - success: boolean
  - message: string
Example response:
```json
{
  "success": false,
  "message": "Failed to resend verification OTP"
}
```

---
