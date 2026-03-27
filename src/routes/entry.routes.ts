import { Router } from "express";
import entryController from "../controllers/entry.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";
import { PERMISSIONS } from "../constants/permissions";

const router = Router();

/**
 * @swagger
 * /entries:
 *   post:
 *     tags: [Entries]
 *     summary: Create a new entry
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
router.post("/",
  authenticate,
  checkPermission(PERMISSIONS.ENTRIES_CREATE),
  entryController.create.bind(entryController)
);
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
 *     security:
 *       - bearerAuth: []
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
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", entryController.findById.bind(entryController));
router.put("/:id",
  authenticate,
  checkPermission(PERMISSIONS.ENTRIES_UPDATE),
  entryController.update.bind(entryController)
);
router.delete("/:id",
  authenticate,
  checkPermission(PERMISSIONS.ENTRIES_DELETE),
  entryController.delete.bind(entryController)
);

/**
 * @swagger
 * /entries/category/{categoryId}:
 *   get:
 *     tags: [Entries]
 *     summary: Get entries by category ID
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of entries for category
 */
router.get(
  "/category/:categoryId",
  entryController.findByCategoryId.bind(entryController)
);

export default router;
