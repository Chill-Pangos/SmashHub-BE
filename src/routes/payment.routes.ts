import { Router } from "express";
import paymentController from "../controllers/payment.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";
import { PERMISSIONS } from "../constants/permissions";

const router = Router();

/**
 * @swagger
 * /payments:
 *   post:
 *     tags: [Payments]
 *     summary: Create payment for entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entryId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *                 enum: [cash, bank_transfer, online]
 *     responses:
 *       201:
 *         description: Payment created
 */
router.post(
  "/",
  authenticate,
  paymentController.createPayment.bind(paymentController)
);

/**
 * @swagger
 * /payments/cash:
 *   post:
 *     tags: [Payments]
 *     summary: Record cash payment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entryId:
 *                 type: integer
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Cash payment recorded
 */
router.post(
  "/cash",
  authenticate,
  checkPermission(PERMISSIONS.PAYMENTS_UPDATE),
  paymentController.recordCashPayment.bind(paymentController)
);

/**
 * @swagger
 * /payments/online:
 *   post:
 *     tags: [Payments]
 *     summary: Record online payment (webhook simulation)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entryId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               transactionRef:
 *                 type: string
 *     responses:
 *       201:
 *         description: Online payment recorded
 */
router.post(
  "/online",
  authenticate,
  paymentController.recordOnlinePayment.bind(paymentController)
);

/**
 * @swagger
 * /payments/entry/{entryId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payments by entry
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: integer
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *     responses:
 *       200:
 *         description: List of payments
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
 *     summary: Get payments by category (admin/organizer)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [cash, bank_transfer, online]
 *     responses:
 *       200:
 *         description: List of payments
 */
router.get(
  "/category/:categoryId",
  authenticate,
  checkPermission(PERMISSIONS.PAYMENTS_VIEW),
  paymentController.getPaymentsByCategory.bind(paymentController)
);

/**
 * @swagger
 * /payments/category/{categoryId}/stats:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment statistics for category (admin/organizer)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment statistics
 */
router.get(
  "/category/:categoryId/stats",
  authenticate,
  checkPermission(PERMISSIONS.PAYMENTS_VIEW),
  paymentController.getPaymentStats.bind(paymentController)
);

/**
 * @swagger
 * /payments/pending:
 *   get:
 *     tags: [Payments]
 *     summary: Get pending payments (admin)
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [cash, bank_transfer, online]
 *     responses:
 *       200:
 *         description: List of pending payments
 */
router.get(
  "/pending",
  checkPermission(PERMISSIONS.PAYMENTS_VIEW),
  paymentController.getPendingPayments.bind(paymentController)
);

/**
 * @swagger
 * /payments/{paymentId}:
 *   get:
 *     tags: [Payments]
 *     summary: Get payment by ID
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment details
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
 *     summary: Confirm payment (organizer)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               proofImageUrl:
 *                 type: string
 *               transactionRef:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment confirmed
 */
router.post(
  "/:paymentId/confirm",
  authenticate,
  checkPermission(PERMISSIONS.PAYMENTS_UPDATE),
  paymentController.confirmPayment.bind(paymentController)
);

/**
 * @swagger
 * /payments/{paymentId}/reject:
 *   post:
 *     tags: [Payments]
 *     summary: Reject payment (organizer)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment rejected
 */
router.post(
  "/:paymentId/reject",
  authenticate,
  checkPermission(PERMISSIONS.PAYMENTS_UPDATE),
  paymentController.rejectPayment.bind(paymentController)
);

/**
 * @swagger
 * /payments/{paymentId}/refund:
 *   post:
 *     tags: [Payments]
 *     summary: Refund payment (organizer)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment refunded
 */
router.post(
  "/:paymentId/refund",
  authenticate,
  checkPermission(PERMISSIONS.PAYMENTS_UPDATE),
  paymentController.refundPayment.bind(paymentController)
);

/**
 * @swagger
 * /payments/{paymentId}/proof:
 *   put:
 *     tags: [Payments]
 *     summary: Update payment proof image
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               proofImageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Proof image updated
 */
router.put(
  "/:paymentId/proof",
  authenticate,
  paymentController.updatePaymentProof.bind(paymentController)
);

export default router;
