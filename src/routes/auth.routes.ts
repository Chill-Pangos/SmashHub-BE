import { Router } from "express";
import authController from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register new user account
 *     description: Create a new user account. Email must be unique and in valid format. Password must be at least 8 characters, contain 1 uppercase letter, 1 number, and 1 special character (!@#$%^&*()_+-=[]{}';:"|,.<>/?\\). User is assigned 'spectator' role by default unless specified otherwise. Email verification is required after registration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 1
 *                 example: Nguyễn
 *                 description: User first name (required, non-empty)
 *               lastName:
 *                 type: string
 *                 minLength: 1
 *                 example: Văn A
 *                 description: User last name (required, non-empty)
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nguyenvana@example.com
 *                 description: Valid email address (must be unique, RFC 5322 format)
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *                 minLength: 8
 *                 description: Strong password (min 8 chars, 1 uppercase, 1 digit, 1 special char)
 *               role:
 *                 type: string
 *                 example: spectator
 *                 description: User role name (defaults to 'spectator' if not provided)
 *     responses:
 *       201:
 *         description: User registered successfully with tokens and user details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 42
 *                         firstName:
 *                           type: string
 *                           example: Nguyễn
 *                         lastName:
 *                           type: string
 *                           example: Văn A
 *                         email:
 *                           type: string
 *                           example: nguyenvana@example.com
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: integer
 *                           example: [8]
 *                           description: Array of role IDs assigned to user
 *                         isEmailVerified:
 *                           type: boolean
 *                           example: false
 *                           description: Email verification status (false until verified via OTP)
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQyLCJpYXQiOjE3MTk2NTMyOTUsImV4cCI6MTcxOTY1Njg5NX0.ABC123...
 *                       description: JWT access token for authenticated requests
 *                     refreshToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQyLCJpYXQiOjE3MTk2NTMyOTUsImV4cCI6MTcyMDI1ODI5NX0.XYZ789...
 *                       description: JWT refresh token for obtaining new access tokens
 *       400:
 *         description: Invalid input - validation error or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Email already exists or Password does not meet requirements
 *       500:
 *         description: Internal server error during registration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.post("/register", authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate user and obtain tokens
 *     description: Login with email and password. User must have a verified email to login. Returns access and refresh tokens for authenticated requests. Invalidates all previous tokens for security.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nguyenvana@example.com
 *                 description: Registered email address (RFC 5322 format)
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *                 description: Account password
 *     responses:
 *       200:
 *         description: Login successful with user data and tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQyLCJpYXQiOjE3MTk2NTMyOTUsImV4cCI6MTcxOTY1Njg5NX0.ABC123...
 *                       description: JWT access token (short-lived, typically ~1 hour)
 *                     refreshToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQyLCJpYXQiOjE3MTk2NTMyOTUsImV4cCI6MTcyMDI1ODI5NX0.XYZ789...
 *                       description: JWT refresh token (long-lived, for getting new access tokens)
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 42
 *                         firstName:
 *                           type: string
 *                           example: Nguyễn
 *                         lastName:
 *                           type: string
 *                           example: Văn A
 *                         email:
 *                           type: string
 *                           example: nguyenvana@example.com
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: integer
 *                           example: [8]
 *                           description: Array of assigned role IDs
 *                         isEmailVerified:
 *                           type: boolean
 *                           example: true
 *                           description: Email verification status
 *       400:
 *         description: Invalid email format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid email format
 *       401:
 *         description: Invalid credentials or email not verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Email is not verified or Invalid credentials
 *       500:
 *         description: Internal server error during login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Obtain new access token using refresh token
 *     description: Use a valid refresh token to obtain a new access token and refresh token. The old refresh token will be invalidated for security. Refresh tokens are long-lived but single-use.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQyLCJpYXQiOjE3MTk2NTMyOTUsImV4cCI6MTcyMDI1ODI5NX0.XYZ789...
 *                 description: Valid JWT refresh token from login or previous refresh
 *     responses:
 *       200:
 *         description: Token refreshed successfully with new tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Token refreshed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQyLCJpYXQiOjE3MTk2NTMyOTUsImV4cCI6MTcxOTY1Njg5NX0.ABC123...
 *                       description: New JWT access token
 *                     refreshToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQyLCJpYXQiOjE3MTk2NTMyOTUsImV4cCI6MTcyMDI1ODI5NX0.XYZ789...
 *                       description: New JWT refresh token
 *       400:
 *         description: Missing or invalid refresh token format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Refresh token is required
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid or expired refresh token
 *       500:
 *         description: Internal server error during token refresh
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.post("/refresh", authController.refreshToken);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change user password (authenticated)
 *     description: Change the current user's password. Requires valid authentication token. Old password must be verified. New password must be at least 8 characters, contain 1 uppercase letter, 1 number, and 1 special character, and must be different from old password.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 example: OldPass123!
 *                 description: Current password for verification
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewStrongPass456!
 *                 minLength: 8
 *                 description: New password (min 8 chars, 1 uppercase, 1 digit, 1 special char, must differ from old)
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       400:
 *         description: Invalid old password, weak new password, or password is same as old
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Old password is incorrect or new password does not meet requirements
 *       401:
 *         description: Unauthorized - Invalid, expired, or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal server error during password change
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.post("/change-password", authenticate, authController.changePassword);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user (authenticated)
 *     description: Logout the current authenticated user. Invalidates all active tokens for this user. No request body required - user ID is extracted from the authentication token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful - all user tokens have been invalidated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logout successful
 *       401:
 *         description: Unauthorized - Invalid, expired, or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal server error during logout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.post("/logout", authenticate, authController.logout);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset - Send OTP to email
 *     description: Request a password reset by sending a 6-digit OTP code to the registered email address. OTP expires in 5 minutes. Any existing unused OTPs for this user are invalidated. Email must be in valid format.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nguyenvana@example.com
 *                 description: Registered email address to receive password reset OTP
 *     responses:
 *       200:
 *         description: OTP sent successfully to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: OTP has been sent to your email
 *       400:
 *         description: Invalid email format or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid email format or user not found
 *       500:
 *         description: Failed to send OTP email or internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Failed to send OTP
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify password reset OTP code
 *     description: Verify the 6-digit OTP code sent to email for password reset. OTP must be valid and not expired (5 minute expiry). Verification does not reset the password - only checks OTP validity. Use /auth/reset-password to actually reset password with OTP.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nguyenvana@example.com
 *                 description: Email address associated with the OTP
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 pattern: '^\d{6}$'
 *                 example: "123456"
 *                 description: 6-digit numeric OTP code received via email
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: OTP verified successfully
 *       400:
 *         description: Invalid email format, invalid OTP, or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid OTP or OTP has expired
 *       500:
 *         description: Internal server error during OTP verification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.post("/verify-otp", authController.verifyOtp);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with verified OTP
 *     description: Reset user password using a verified OTP code. OTP must be valid and not expired. New password must be at least 8 characters, contain 1 uppercase letter, 1 number, and 1 special character, and must be different from the current password. All existing tokens are invalidated for security after password reset.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nguyenvana@example.com
 *                 description: Email address associated with the password reset request
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 pattern: '^\d{6}$'
 *                 example: "123456"
 *                 description: Valid 6-digit OTP code from /auth/forgot-password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewPassword456!
 *                 minLength: 8
 *                 description: New password (min 8 chars, 1 uppercase, 1 digit, 1 special char, must differ from old)
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password has been reset successfully
 *       400:
 *         description: Invalid email format, invalid/expired OTP, weak password, or password same as old
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid OTP, new password does not meet requirements, or password is same as current
 *       500:
 *         description: Internal server error during password reset
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.post("/reset-password", authController.resetPassword);

/**
 * @swagger
 * /auth/send-email-verification-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Send email verification OTP
 *     description: Send a 6-digit OTP code to the user's email for email verification. Can only be sent to unverified emails. OTP expires in 5 minutes. Any existing unused OTPs for this user are invalidated. Email must be in valid format.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nguyenvana@example.com
 *                 description: Email address to verify (must not be already verified)
 *     responses:
 *       200:
 *         description: Verification OTP sent successfully to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Verification OTP has been sent to your email
 *       400:
 *         description: Invalid email format, user not found, or email already verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Email already verified or Invalid email format
 *       500:
 *         description: Failed to send OTP email or internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Failed to send verification OTP
 */
router.post("/send-email-verification-otp", authController.sendEmailVerificationOtp);

/**
 * @swagger
 * /auth/verify-email-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email with OTP
 *     description: Verify the user's email address using the 6-digit OTP code sent via email. OTP must be valid and not expired (5 minute expiry). After successful verification, user's email is marked as verified and can login.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nguyenvana@example.com
 *                 description: Email address being verified
 *               otp:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *                 pattern: '^\d{6}$'
 *                 example: "123456"
 *                 description: 6-digit numeric OTP code received via email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Email has been verified successfully
 *       400:
 *         description: Email verification failed - invalid email, OTP, or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid OTP or OTP has expired
 *       500:
 *         description: Internal server error during email verification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.post("/verify-email-otp", authController.verifyEmailOtp);

/**
 * @swagger
 * /auth/resend-email-verification-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Resend email verification OTP
 *     description: Resend a new 6-digit OTP code to the user's email for email verification. Can be used if the previous OTP expired or was not received. Any existing unused OTPs for this email are invalidated. OTP expires in 5 minutes. Email must be in valid format and not already verified.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nguyenvana@example.com
 *                 description: Email address to resend OTP to (must not be already verified)
 *     responses:
 *       200:
 *         description: New verification OTP resent successfully to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: A new OTP code has been sent to your email
 *       400:
 *         description: Invalid email format, user not found, or email already verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Email already verified or Invalid email format
 *       500:
 *         description: Failed to resend OTP email or internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Failed to resend verification OTP
 */
router.post("/resend-email-verification-otp", authController.resendEmailVerificationOtp);

export default router;
