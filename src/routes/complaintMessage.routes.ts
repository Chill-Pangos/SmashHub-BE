import { Router } from "express";
import complaintMessageController from "../controllers/complaintMessage.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";
import { PERMISSIONS } from "../constants/permissions";

const router = Router();

/**
 * @swagger
 * /complaint-messages:
 *   post:
 *     tags: [Complaint Messages]
 *     summary: Create a new complaint message
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Message created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Complaint Messages]
 *     summary: Get all complaint messages
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of messages ordered by creation time
 */
router.post(
  "/",
  authenticate,
  checkPermission(PERMISSIONS.COMPLAINTS_CREATE),
  complaintMessageController.create.bind(complaintMessageController)
);
router.get(
  "/",
  complaintMessageController.findAll.bind(complaintMessageController)
);

/**
 * @swagger
 * /complaint-messages/{id}:
 *   get:
 *     tags: [Complaint Messages]
 *     summary: Get message by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Message details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Complaint Messages]
 *     summary: Update message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Message updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Complaint Messages]
 *     summary: Delete message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get(
  "/:id",
  complaintMessageController.findById.bind(complaintMessageController)
);
router.put(
  "/:id",
  complaintMessageController.update.bind(complaintMessageController)
);
router.delete(
  "/:id",
  complaintMessageController.delete.bind(complaintMessageController)
);

/**
 * @swagger
 * /complaint-messages/complaint/{complaintId}:
 *   get:
 *     tags: [Complaint Messages]
 *     summary: Get messages by complaint ID
 *     parameters:
 *       - in: path
 *         name: complaintId
 *         required: true
 *         schema:
 *           type: integer
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of messages for complaint
 */
router.get(
  "/complaint/:complaintId",
  complaintMessageController.findByComplaintId.bind(complaintMessageController)
);

/**
 * @swagger
 * /complaint-messages/unread/user/{userId}:
 *   get:
 *     tags: [Complaint Messages]
 *     summary: Get unread messages for user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of unread messages
 */
router.get(
  "/unread/user/:userId",
  complaintMessageController.findUnreadByUserId.bind(complaintMessageController)
);

/**
 * @swagger
 * /complaint-messages/{id}/read:
 *   patch:
 *     tags: [Complaint Messages]
 *     summary: Mark message as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Message marked as read
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
  "/:id/read",
  complaintMessageController.markAsRead.bind(complaintMessageController)
);

export default router;
