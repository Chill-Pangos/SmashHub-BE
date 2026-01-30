import { Router } from "express";
import complaintWorkflowController from "../controllers/complaintWorkflow.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";
import { PERMISSIONS } from "../constants/permissions";

const router = Router();

/**
 * @swagger
 * /complaint-workflows:
 *   post:
 *     tags: [Complaint Workflows]
 *     summary: Create a new complaint workflow entry
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
 *         description: Workflow entry created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Complaint Workflows]
 *     summary: Get all complaint workflow entries
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of workflow entries
 */
router.post(
  "/",
  authenticate,
  checkPermission(PERMISSIONS.COMPLAINTS_ASSIGN),
  complaintWorkflowController.create.bind(complaintWorkflowController)
);
router.get(
  "/",
  complaintWorkflowController.findAll.bind(complaintWorkflowController)
);

/**
 * @swagger
 * /complaint-workflows/{id}:
 *   get:
 *     tags: [Complaint Workflows]
 *     summary: Get workflow entry by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Workflow entry details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Complaint Workflows]
 *     summary: Delete workflow entry
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
  complaintWorkflowController.findById.bind(complaintWorkflowController)
);
router.delete(
  "/:id",
  complaintWorkflowController.delete.bind(complaintWorkflowController)
);

/**
 * @swagger
 * /complaint-workflows/complaint/{complaintId}:
 *   get:
 *     tags: [Complaint Workflows]
 *     summary: Get workflow entries by complaint ID
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
 *         description: List of workflow entries for complaint
 */
router.get(
  "/complaint/:complaintId",
  complaintWorkflowController.findByComplaintId.bind(
    complaintWorkflowController
  )
);

/**
 * @swagger
 * /complaint-workflows/user/{userId}:
 *   get:
 *     tags: [Complaint Workflows]
 *     summary: Get workflow entries by user ID
 *     description: Returns workflows where user is either sender or receiver
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
 *         description: List of workflow entries for user
 */
router.get(
  "/user/:userId",
  complaintWorkflowController.findByUserId.bind(complaintWorkflowController)
);

export default router;
