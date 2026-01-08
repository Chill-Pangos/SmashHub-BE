import { Router } from "express";
import permissionController from "../controllers/permission.controller";

const router = Router();

/**
 * @swagger
 * /permissions:
 *   post:
 *     tags: [Permissions]
 *     summary: Create a new permission
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Permission created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Permissions]
 *     summary: Get all permissions
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of permissions
 */
router.post("/", permissionController.create.bind(permissionController));
router.get("/", permissionController.findAll.bind(permissionController));

/**
 * @swagger
 * /permissions/{id}:
 *   get:
 *     tags: [Permissions]
 *     summary: Get permission by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Permission details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Permissions]
 *     summary: Update permission
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Permission updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Permissions]
 *     summary: Delete permission
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", permissionController.findById.bind(permissionController));
router.put("/:id", permissionController.update.bind(permissionController));
router.delete("/:id", permissionController.delete.bind(permissionController));

export default router;
