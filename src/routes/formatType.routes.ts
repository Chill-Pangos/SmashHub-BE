import { Router } from "express";
import formatTypeController from "../controllers/formatType.controller";

const router = Router();

/**
 * @swagger
 * /format-types:
 *   post:
 *     tags: [Format Types]
 *     summary: Create a new format type
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Format type created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Format Types]
 *     summary: Get all format types
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of format types
 */
router.post("/", formatTypeController.create.bind(formatTypeController));
router.get("/", formatTypeController.findAll.bind(formatTypeController));

/**
 * @swagger
 * /format-types/{id}:
 *   get:
 *     tags: [Format Types]
 *     summary: Get format type by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Format type details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Format Types]
 *     summary: Update format type
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Format type updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Format Types]
 *     summary: Delete format type
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", formatTypeController.findById.bind(formatTypeController));
router.put("/:id", formatTypeController.update.bind(formatTypeController));
router.delete("/:id", formatTypeController.delete.bind(formatTypeController));

export default router;
