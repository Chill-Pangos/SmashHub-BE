import { Router } from "express";
import complaintController from "../controllers/complaint.controller";

const router = Router();

/**
 * @swagger
 * /complaints:
 *   post:
 *     tags: [Complaints]
 *     summary: Create a new complaint
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Complaint created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Complaints]
 *     summary: Get all complaints
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of complaints
 */
router.post("/", complaintController.create.bind(complaintController));
router.get("/", complaintController.findAll.bind(complaintController));

/**
 * @swagger
 * /complaints/{id}:
 *   get:
 *     tags: [Complaints]
 *     summary: Get complaint by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Complaint details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Complaints]
 *     summary: Update complaint
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Complaint updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Complaints]
 *     summary: Delete complaint
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", complaintController.findById.bind(complaintController));
router.put("/:id", complaintController.update.bind(complaintController));
router.delete("/:id", complaintController.delete.bind(complaintController));

/**
 * @swagger
 * /complaints/user/{userId}:
 *   get:
 *     tags: [Complaints]
 *     summary: Get complaints by user ID
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
 *         description: List of user complaints
 */
router.get(
  "/user/:userId",
  complaintController.findByUserId.bind(complaintController)
);

/**
 * @swagger
 * /complaints/tournament/{tournamentId}:
 *   get:
 *     tags: [Complaints]
 *     summary: Get complaints by tournament ID
 *     parameters:
 *       - in: path
 *         name: tournamentId
 *         required: true
 *         schema:
 *           type: integer
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of tournament complaints
 */
router.get(
  "/tournament/:tournamentId",
  complaintController.findByTournamentId.bind(complaintController)
);

/**
 * @swagger
 * /complaints/status/{status}:
 *   get:
 *     tags: [Complaints]
 *     summary: Get complaints by status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of complaints with specified status
 */
router.get(
  "/status/:status",
  complaintController.findByStatus.bind(complaintController)
);

export default router;
