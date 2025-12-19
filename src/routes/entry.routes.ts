import { Router } from "express";
import entryController from "../controllers/entry.controller";

const router = Router();

/**
 * @swagger
 * /entries:
 *   post:
 *     tags: [Entries]
 *     summary: Create a new entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Entry created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Entries]
 *     summary: Get all entries
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of entries
 */
router.post("/", entryController.create.bind(entryController));
router.get("/", entryController.findAll.bind(entryController));

/**
 * @swagger
 * /entries/{id}:
 *   get:
 *     tags: [Entries]
 *     summary: Get entry by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Entry details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Entries]
 *     summary: Update entry
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Entry updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Entries]
 *     summary: Delete entry
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", entryController.findById.bind(entryController));
router.put("/:id", entryController.update.bind(entryController));
router.delete("/:id", entryController.delete.bind(entryController));

/**
 * @swagger
 * /entries/content/{contentId}:
 *   get:
 *     tags: [Entries]
 *     summary: Get entries by content ID
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of entries for content
 */
router.get(
  "/content/:contentId",
  entryController.findByContentId.bind(entryController)
);

export default router;
