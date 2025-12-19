import { Router } from "express";
import scheduleController from "../controllers/schedule.controller";

const router = Router();

/**
 * @swagger
 * /schedules:
 *   post:
 *     tags: [Schedules]
 *     summary: Create a new schedule
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Schedule created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Schedules]
 *     summary: Get all schedules
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of schedules ordered by scheduled time
 */
router.post("/", scheduleController.create.bind(scheduleController));
router.get("/", scheduleController.findAll.bind(scheduleController));

/**
 * @swagger
 * /schedules/{id}:
 *   get:
 *     tags: [Schedules]
 *     summary: Get schedule by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Schedule details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Schedules]
 *     summary: Update schedule
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Schedule updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Schedules]
 *     summary: Delete schedule
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", scheduleController.findById.bind(scheduleController));
router.put("/:id", scheduleController.update.bind(scheduleController));
router.delete("/:id", scheduleController.delete.bind(scheduleController));

export default router;
