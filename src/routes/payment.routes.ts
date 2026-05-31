import { Router } from "express";
import paymentController from "../controllers/payment.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router();

/**
 * @swagger
 * /payments:
 *   post:
 *     tags: [Payments]
 *     summary: Create pending payment for entry
 *     description: |
 *       Create a pending payment record for an entry using bank transfer or online method.
 *       The payment amount MUST match the category's entry fee exactly (within 0.01 tolerance).
 *
 *       Business Logic:
 *       - Only one active payment (pending or completed) is allowed per entry
 *       - Cash payments should use POST /payments/record-cash endpoint instead
 *       - For bank transfers: proof image must be uploaded before confirmation
 *       - For online payments: transaction reference is required from payment gateway
 *       - Authenticated user is recording the payment attempt
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [entryId, amount, method]
 *             properties:
 *               entryId:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID of the entry that requires payment
 *                 example: 42
 *               amount:
 *                 type: number
 *                 format: double
 *                 minimum: 0.01
 *                 description: Payment amount in VND. Must match the category's entry fee exactly
 *                 example: 250000
 *               method:
 *                 type: string
 *                 enum: [bank_transfer, online]
 *                 description: Payment method (bank_transfer for manual bank transfers, online for payment gateway webhooks)
 *                 example: bank_transfer
 *           examples:
 *             BankTransfer:
 *               value:
 *                 entryId: 42
 *                 amount: 250000
 *                 method: bank_transfer
 *             OnlinePayment:
 *               value:
 *                 entryId: 42
 *                 amount: 250000
 *                 method: online
 *     responses:
 *       201:
 *         description: Payment created successfully with pending status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     entryId:
 *                       type: integer
 *                       example: 42
 *                     amount:
 *                       type: number
 *                       format: double
 *                       example: 250000
 *                     method:
 *                       type: string
 *                       enum: [bank_transfer, online]
 *                       example: bank_transfer
 *                     status:
 *                       type: string
 *                       enum: [pending, completed, failed, refunded]
 *                       example: pending
 *                     proofImageUrl:
 *                       type: string
 *                       nullable: true
 *                       description: URL of bank transfer proof (null until confirmed)
 *                       example: null
 *                     transactionRef:
 *                       type: string
 *                       nullable: true
 *                       description: Payment gateway transaction reference (null until confirmed)
 *                       example: null
 *                     confirmedBy:
 *                       type: integer
 *                       nullable: true
 *                       description: ID of organizer who confirmed the payment (null until confirmed)
 *                       example: null
 *                     confirmedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       description: Timestamp when payment was confirmed (null until confirmed)
 *                       example: null
 *                     refundedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       description: Timestamp when payment was refunded (null unless refunded)
 *                       example: null
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-27T10:30:00Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-27T10:30:00Z"
 *                 message:
 *                   type: string
 *                   example: "Payment created successfully"
 *       400:
 *         description: Invalid request (entry not found, amount mismatch, category has no fee, etc.)
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         description: Authentication required or invalid token
 *         $ref: '#/components/responses/Unauthorized401'
 *       409:
 *         description: Conflict - entry already has pending or completed payment
 *         $ref: '#/components/responses/Conflict409'
 *       500:
 *         description: Server error
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/",
  authenticate,
  paymentController.createPayment.bind(paymentController)
);

/**
 * @swagger
 * /payments/record-cash:
 *   post:
 *     tags: [Payments]
 *     summary: Record and confirm cash payment (organizer only)
 *     description: |
 *       Record and immediately confirm a cash payment for an entry in a single operation.
 *       Only tournament organizers can use this endpoint.
 *
 *       Business Logic:
 *       - Cash payments are confirmed immediately (status = completed)
 *       - Authenticated organizer user ID is recorded as confirmedBy
 *       - Amount MUST match the category's entry fee exactly
 *       - Only one cash payment per entry is allowed
 *       - No proof image or transaction reference is required for cash
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [entryId, amount]
 *             properties:
 *               entryId:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID of the entry receiving cash payment
 *                 example: 42
 *               amount:
 *                 type: number
 *                 format: double
 *                 minimum: 0.01
 *                 description: Cash payment amount in VND. Must match entry fee
 *                 example: 250000
 *           examples:
 *             CashPayment:
 *               value:
 *                 entryId: 42
 *                 amount: 250000
 *     responses:
 *       201:
 *         description: Cash payment recorded and immediately confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 2
 *                     entryId:
 *                       type: integer
 *                       example: 42
 *                     amount:
 *                       type: number
 *                       format: double
 *                       example: 250000
 *                     method:
 *                       type: string
 *                       enum: [cash, bank_transfer, online]
 *                       example: cash
 *                     status:
 *                       type: string
 *                       enum: [pending, completed, failed, refunded]
 *                       description: Always 'completed' for cash payments
 *                       example: completed
 *                     confirmedBy:
 *                       type: integer
 *                       description: Organizer user ID who recorded the cash payment
 *                       example: 5
 *                     confirmedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when cash payment was recorded
 *                       example: "2026-05-27T10:35:00Z"
 *                     proofImageUrl:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     transactionRef:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     refundedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: null
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-27T10:35:00Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-27T10:35:00Z"
 *                 message:
 *                   type: string
 *                   example: "Cash payment recorded successfully"
 *       400:
 *         description: Invalid request (entry not found, amount mismatch, entry has no fee, entry already has cash payment)
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         description: Authentication required or invalid token
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         description: Permission denied - user is not tournament organizer
 *         $ref: '#/components/responses/Forbidden403'
 *       409:
 *         description: Conflict - cash payment already exists for this entry
 *         $ref: '#/components/responses/Conflict409'
 *       500:
 *         description: Server error
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/record-cash",
  authenticate,
  checkPermission('payments:update'),
  paymentController.recordCashPayment.bind(paymentController)
);

/**
 * @swagger
 * /payments/record-online:
 *   post:
 *     tags: [Payments]
 *     summary: Record online payment from payment gateway webhook
 *     description: |
 *       Record and immediately confirm an online payment from payment gateway webhook (Stripe, VNPay, etc.).
 *       This endpoint processes successful online transactions and creates a confirmed payment record.
 *
 *       Business Logic:
 *       - Online payments are confirmed immediately (status = completed)
 *       - Transaction reference is required and must be unique to prevent double-processing
 *       - Amount MUST match the category's entry fee exactly
 *       - This endpoint is typically called by payment gateway webhooks (no manual confirmation needed)
 *       - Duplicate transaction references are rejected to ensure idempotency
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [entryId, amount, transactionRef]
 *             properties:
 *               entryId:
 *                 type: integer
 *                 minimum: 1
 *                 description: ID of the entry being paid for
 *                 example: 42
 *               amount:
 *                 type: number
 *                 format: double
 *                 minimum: 0.01
 *                 description: Payment amount in VND. Must match entry fee
 *                 example: 250000
 *               transactionRef:
 *                 type: string
 *                 maxLength: 100
 *                 description: Unique transaction reference from payment gateway (Stripe PI, VNPay txnRef, etc.). Must be globally unique
 *                 example: "stripe_pi_1234567890abc"
 *           examples:
 *             StripeWebhook:
 *               value:
 *                 entryId: 42
 *                 amount: 250000
 *                 transactionRef: "stripe_pi_1234567890abc"
 *             VNPayWebhook:
 *               value:
 *                 entryId: 42
 *                 amount: 250000
 *                 transactionRef: "vnpay_20260527103000_12345"
 *     responses:
 *       201:
 *         description: Online payment recorded and confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 3
 *                     entryId:
 *                       type: integer
 *                       example: 42
 *                     amount:
 *                       type: number
 *                       format: double
 *                       example: 250000
 *                     method:
 *                       type: string
 *                       enum: [cash, bank_transfer, online]
 *                       example: online
 *                     status:
 *                       type: string
 *                       enum: [pending, completed, failed, refunded]
 *                       description: Always 'completed' for online payments
 *                       example: completed
 *                     transactionRef:
 *                       type: string
 *                       description: Payment gateway transaction reference
 *                       example: "stripe_pi_1234567890abc"
 *                     confirmedBy:
 *                       type: integer
 *                       nullable: true
 *                       description: Null for online payments (auto-confirmed by webhook)
 *                       example: null
 *                     confirmedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when payment was confirmed by webhook
 *                       example: "2026-05-27T10:40:00Z"
 *                     proofImageUrl:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     refundedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: null
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-27T10:40:00Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-27T10:40:00Z"
 *                 message:
 *                   type: string
 *                   example: "Online payment recorded successfully"
 *       400:
 *         description: Invalid request (entry not found, amount mismatch, entry has no fee)
 *         $ref: '#/components/responses/BadRequest400'
 *       409:
 *         description: Conflict - transaction reference already processed
 *         $ref: '#/components/responses/Conflict409'
 *       500:
 *         description: Server error
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/record-online",
  authenticate,
  paymentController.recordOnlinePayment.bind(paymentController)
);

/**
 * @swagger
 * /payments/entry/{entryId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payments for an entry
 *     description: |
 *       Retrieve all payments for a specific entry with pagination and optional status filtering.
 *
 *       Business Logic:
 *       - Typically a team captain would check their entry's payment status
 *       - Returns latest payments first (sorted by createdAt DESC)
 *       - Team captain can view their payment status
 *       - Entry must exist
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Entry ID to retrieve payments for
 *         example: 42
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination (1-indexed)
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of records per page
 *         example: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *         description: Filter by payment status (optional)
 *         example: pending
 *     responses:
 *       200:
 *         description: List of payments for entry with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     rows:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           entryId:
 *                             type: integer
 *                             example: 42
 *                           amount:
 *                             type: number
 *                             format: double
 *                             example: 250000
 *                           method:
 *                             type: string
 *                             enum: [cash, bank_transfer, online]
 *                             example: bank_transfer
 *                           status:
 *                             type: string
 *                             enum: [pending, completed, failed, refunded]
 *                             example: completed
 *                           proofImageUrl:
 *                             type: string
 *                             nullable: true
 *                             example: null
 *                           transactionRef:
 *                             type: string
 *                             nullable: true
 *                             example: null
 *                           confirmedBy:
 *                             type: integer
 *                             nullable: true
 *                             description: Organizer user ID
 *                             example: 5
 *                           confirmedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: "2026-05-27T10:35:00Z"
 *                           refundedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: null
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-05-27T10:30:00Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-05-27T10:35:00Z"
 *                     count:
 *                       type: integer
 *                       description: Total number of payments for this entry
 *                       example: 1
 *       404:
 *         description: Entry not found
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         description: Server error
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/entry/:entryId",
  paymentController.getPaymentsByEntry.bind(paymentController)
);

/**
 * @swagger
 * /payments/category/{categoryId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payments by category (organizer only)
 *     description: Retrieve all payments for a tournament category with optional filtering by status and payment method. Only tournament organizers can access this endpoint.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament category ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of records per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *         description: Filter by payment status
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [cash, bank_transfer, online]
 *         description: Filter by payment method
 *     responses:
 *       200:
 *         description: List of payments for category with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     rows:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           entryId:
 *                             type: integer
 *                             example: 42
 *                           amount:
 *                             type: number
 *                             example: 250000
 *                           method:
 *                             type: string
 *                             enum: [cash, bank_transfer, online]
 *                             example: bank_transfer
 *                           status:
 *                             type: string
 *                             enum: [pending, completed, failed, refunded]
 *                             example: completed
 *                           proofImageUrl:
 *                             type: string
 *                             nullable: true
 *                             example: "https://s3.example.com/proof-123.jpg"
 *                           confirmedBy:
 *                             type: integer
 *                             nullable: true
 *                             example: 5
 *                           confirmedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: "2026-05-27T10:35:00Z"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-05-27T10:30:00Z"
 *                           entry:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               captainId:
 *                                 type: integer
 *                           confirmer:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               firstName:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                     count:
 *                       type: integer
 *                       description: Total number of records
 *                       example: 25
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/category/:categoryId",
  authenticate,
  checkPermission('payments:view'),
  paymentController.getPaymentsByCategory.bind(paymentController)
);

/**
 * @swagger
 * /payments/category/{categoryId}/stats:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment statistics for category (organizer only)
 *     description: Retrieve aggregated payment statistics for a tournament category including totals, completion rates, and amounts collected. Only tournament organizers can access this endpoint.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament category ID
 *     responses:
 *       200:
 *         description: Payment statistics for category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of payments
 *                       example: 50
 *                     completed:
 *                       type: integer
 *                       description: Number of completed payments
 *                       example: 35
 *                     pending:
 *                       type: integer
 *                       description: Number of pending payments
 *                       example: 10
 *                     failed:
 *                       type: integer
 *                       description: Number of failed/rejected payments
 *                       example: 3
 *                     refunded:
 *                       type: integer
 *                       description: Number of refunded payments
 *                       example: 2
 *                     totalAmount:
 *                       type: number
 *                       description: Total amount of all payments
 *                       example: 12500000
 *                     collectedAmount:
 *                       type: number
 *                       description: Total amount collected (completed + cash payments)
 *                       example: 8750000
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/category/:categoryId/stats",
  authenticate,
  checkPermission('payments:view'),
  paymentController.getPaymentStats.bind(paymentController)
);

/**
 * @swagger
 * /payments/pending/{categoryId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get pending payments by category (organizer only)
 *     description: Retrieve all pending payments for a tournament category with optional filtering by payment method. Ordered by oldest first for priority processing. Only tournament organizers can access this endpoint.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tournament category ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of records per page
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [cash, bank_transfer, online]
 *         description: Filter by payment method (optional)
 *     responses:
 *       200:
 *         description: List of pending payments ordered by oldest first
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     rows:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 5
 *                           entryId:
 *                             type: integer
 *                             example: 42
 *                           amount:
 *                             type: number
 *                             example: 250000
 *                           method:
 *                             type: string
 *                             enum: [cash, bank_transfer, online]
 *                             example: bank_transfer
 *                           status:
 *                             type: string
 *                             enum: [pending, completed, failed, refunded]
 *                             example: pending
 *                           proofImageUrl:
 *                             type: string
 *                             nullable: true
 *                             example: "https://s3.example.com/proof-123.jpg"
 *                           transactionRef:
 *                             type: string
 *                             nullable: true
 *                             example: null
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-05-27T09:00:00Z"
 *                           entry:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               categoryId:
 *                                 type: integer
 *                               captainId:
 *                                 type: integer
 *                               category:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                   tournamentId:
 *                                     type: integer
 *                                   name:
 *                                     type: string
 *                                   entryFee:
 *                                     type: number
 *                     count:
 *                       type: integer
 *                       description: Total number of pending payments
 *                       example: 5
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/pending/:categoryId",
  authenticate,
  checkPermission('payments:view'),
  paymentController.getPendingPayments.bind(paymentController)
);

/**
 * @swagger
 * /payments/{paymentId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment by ID
 *     description: Retrieve detailed information about a specific payment including entry details, confirmation status, and proof images.
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     entryId:
 *                       type: integer
 *                       example: 42
 *                     amount:
 *                       type: number
 *                       example: 250000
 *                     method:
 *                       type: string
 *                       enum: [cash, bank_transfer, online]
 *                       example: bank_transfer
 *                     status:
 *                       type: string
 *                       enum: [pending, completed, failed, refunded]
 *                       example: pending
 *                     proofImageUrl:
 *                       type: string
 *                       nullable: true
 *                       maxLength: 500
 *                       example: "https://s3.example.com/proof-123.jpg"
 *                     transactionRef:
 *                       type: string
 *                       nullable: true
 *                       maxLength: 100
 *                       example: null
 *                     confirmedBy:
 *                       type: integer
 *                       nullable: true
 *                       description: ID of organizer who confirmed
 *                       example: null
 *                     confirmedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: null
 *                     refundedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: null
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-27T10:30:00Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-27T10:30:00Z"
 *                     entry:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 42
 *                         categoryId:
 *                           type: integer
 *                           example: 10
 *                         captainId:
 *                           type: integer
 *                           example: 100
 *                     confirmer:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get(
  "/:paymentId",
  paymentController.getPaymentById.bind(paymentController)
);

/**
 * @swagger
 * /payments/{paymentId}/confirm:
 *   post:
 *     tags: [Payments]
 *     summary: Confirm payment (organizer only)
 *     description: Confirm a pending payment. For bank transfers, proof image URL is required. For online payments, transaction reference is required. Only tournament organizers can confirm payments.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment ID to confirm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               proofImageUrl:
 *                 type: string
 *                 maxLength: 500
 *                 description: URL of proof image (required for bank_transfer, optional for others)
 *                 example: "https://s3.example.com/proof-123.jpg"
 *               transactionRef:
 *                 type: string
 *                 maxLength: 100
 *                 description: Transaction reference (required for online payments)
 *                 example: "vnpay_123456"
 *     responses:
 *       200:
 *         description: Payment confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     entryId:
 *                       type: integer
 *                       example: 42
 *                     amount:
 *                       type: number
 *                       example: 250000
 *                     method:
 *                       type: string
 *                       enum: [cash, bank_transfer, online]
 *                       example: bank_transfer
 *                     status:
 *                       type: string
 *                       enum: [pending, completed, failed, refunded]
 *                       example: completed
 *                     proofImageUrl:
 *                       type: string
 *                       example: "https://s3.example.com/proof-123.jpg"
 *                     transactionRef:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     confirmedBy:
 *                       type: integer
 *                       example: 5
 *                     confirmedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-27T10:35:00Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-27T10:35:00Z"
 *                 message:
 *                   type: string
 *                   example: "Payment confirmed successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/:paymentId/confirm",
  authenticate,
  checkPermission('payments:update'),
  paymentController.confirmPayment.bind(paymentController)
);

/**
 * @swagger
 * /payments/{paymentId}/reject:
 *   post:
 *     tags: [Payments]
 *     summary: Reject pending payment (organizer only)
 *     description: Reject a pending payment, marking it as failed. Only tournament organizers can reject payments. Can only reject payments in pending status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment ID to reject
 *     responses:
 *       200:
 *         description: Payment rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     entryId:
 *                       type: integer
 *                       example: 42
 *                     amount:
 *                       type: number
 *                       example: 250000
 *                     method:
 *                       type: string
 *                       enum: [cash, bank_transfer, online]
 *                       example: bank_transfer
 *                     status:
 *                       type: string
 *                       enum: [pending, completed, failed, refunded]
 *                       example: failed
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-27T10:40:00Z"
 *                 message:
 *                   type: string
 *                   example: "Payment rejected successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/:paymentId/reject",
  authenticate,
  checkPermission('payments:update'),
  paymentController.rejectPayment.bind(paymentController)
);

/**
 * @swagger
 * /payments/{paymentId}/refund:
 *   post:
 *     tags: [Payments]
 *     summary: Refund completed payment (organizer only)
 *     description: Initiate a refund for a completed payment. Only tournament organizers can process refunds. Can only refund payments in completed status.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment ID to refund
 *     responses:
 *       200:
 *         description: Payment refunded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     entryId:
 *                       type: integer
 *                       example: 42
 *                     amount:
 *                       type: number
 *                       example: 250000
 *                     method:
 *                       type: string
 *                       enum: [cash, bank_transfer, online]
 *                       example: bank_transfer
 *                     status:
 *                       type: string
 *                       enum: [pending, completed, failed, refunded]
 *                       example: refunded
 *                     refundedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-27T10:45:00Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-27T10:45:00Z"
 *                 message:
 *                   type: string
 *                   example: "Payment refunded successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.post(
  "/:paymentId/refund",
  authenticate,
  checkPermission('payments:update'),
  paymentController.refundPayment.bind(paymentController)
);

/**
 * @swagger
 * /payments/{paymentId}/proof:
 *   put:
 *     tags: [Payments]
 *     summary: Upload payment proof image
 *     description: Upload or update proof image for bank transfer payments. Only the team captain or tournament organizer can upload proof. Proof is only applicable for bank transfer method and pending payments.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [proofImageUrl]
 *             properties:
 *               proofImageUrl:
 *                 type: string
 *                 maxLength: 500
 *                 description: URL of the proof image (screenshot of bank transfer, etc.)
 *                 example: "https://s3.example.com/proof-transfer-123.jpg"
 *     responses:
 *       200:
 *         description: Proof image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     entryId:
 *                       type: integer
 *                       example: 42
 *                     amount:
 *                       type: number
 *                       example: 250000
 *                     method:
 *                       type: string
 *                       enum: [cash, bank_transfer, online]
 *                       example: bank_transfer
 *                     status:
 *                       type: string
 *                       enum: [pending, completed, failed, refunded]
 *                       example: pending
 *                     proofImageUrl:
 *                       type: string
 *                       maxLength: 500
 *                       example: "https://s3.example.com/proof-transfer-123.jpg"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-05-27T10:32:00Z"
 *                 message:
 *                   type: string
 *                   example: "Payment proof uploaded successfully"
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.put(
  "/:paymentId/proof",
  authenticate,
  paymentController.uploadPaymentProof.bind(paymentController)
);

export default router;
