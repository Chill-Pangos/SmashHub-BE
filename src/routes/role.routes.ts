import { Router } from "express";
import roleController from "../controllers/role.controller";

const router = Router();

/**
 * @swagger
 * /roles:
 *   post:
 *     tags: [Roles]
 *     summary: Create a new role
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Roles]
 *     summary: Get all roles
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of roles
 */
router.post("/", roleController.create.bind(roleController));
router.get("/", roleController.findAll.bind(roleController));

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     tags: [Roles]
 *     summary: Get role by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Role details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Roles]
 *     summary: Update role
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Role updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Roles]
 *     summary: Delete role
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", roleController.findById.bind(roleController));
router.put("/:id", roleController.update.bind(roleController));
router.delete("/:id", roleController.delete.bind(roleController));

/**
 * @swagger
 * /roles/name/{name}:
 *   get:
 *     tags: [Roles]
 *     summary: Get role by name
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/name/:name", roleController.findByName.bind(roleController));

export default router;
