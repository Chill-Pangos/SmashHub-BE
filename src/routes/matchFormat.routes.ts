import { Router } from "express";
import matchFormatController from "../controllers/matchFormat.controller";

const router = Router();

/**
 * @swagger
 * /match-formats:
 *   post:
 *     tags: [Match Formats]
 *     summary: Create a new match format
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numberOfSingles
 *               - numberOfDoubles
 *               - description
 *             properties:
 *               numberOfSingles:
 *                 type: integer
 *                 example: 3
 *               numberOfDoubles:
 *                 type: integer
 *                 example: 2
 *               description:
 *                 type: string
 *                 example: "Best of 5 format with 3 singles and 2 doubles"
 *     responses:
 *       201:
 *         description: Match format created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Match Formats]
 *     summary: Get all match formats
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of match formats
 */
router.post("/", matchFormatController.create.bind(matchFormatController));
router.get("/", matchFormatController.findAll.bind(matchFormatController));

/**
 * @swagger
 * /match-formats/{id}:
 *   get:
 *     tags: [Match Formats]
 *     summary: Get match format by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Match format details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Match Formats]
 *     summary: Update match format
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numberOfSingles:
 *                 type: integer
 *                 example: 3
 *               numberOfDoubles:
 *                 type: integer
 *                 example: 2
 *               description:
 *                 type: string
 *                 example: "Best of 5 format with 3 singles and 2 doubles"
 *     responses:
 *       200:
 *         description: Match format updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Match Formats]
 *     summary: Delete match format
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", matchFormatController.findById.bind(matchFormatController));
router.put("/:id", matchFormatController.update.bind(matchFormatController));
router.delete("/:id", matchFormatController.delete.bind(matchFormatController));

export default router;
