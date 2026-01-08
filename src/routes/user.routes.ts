import { Router } from "express";
import userController from "../controllers/user.controller";

const router = Router();

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of users
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post("/", userController.create.bind(userController));
router.get("/", userController.findAll.bind(userController));

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Users]
 *     summary: Update user
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Users]
 *     summary: Delete user
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id", userController.findById.bind(userController));
router.put("/:id", userController.update.bind(userController));
router.delete("/:id", userController.delete.bind(userController));

export default router;
