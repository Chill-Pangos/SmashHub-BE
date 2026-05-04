import { Router } from "express";
import userRoleController from "../controllers/userRole.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/permission.middleware";

const router = Router();

/**
 * @swagger
 * /user-roles:
 *   post:
 *     tags: [User Roles]
 *     summary: Assign role to user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: number
 *               roleId:
 *                 type: number
 *     responses:
 *       201:
 *         description: Role assigned to user
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [User Roles]
 *     summary: Get all user-role assignments
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of user-role assignments
 */
router.post("/",
  authenticate,
  checkRole('admin'),
  userRoleController.create.bind(userRoleController)
);
router.get("/",
  authenticate,
  checkRole('admin'),
  userRoleController.findAll.bind(userRoleController)
);

/**
 * @swagger
 * /user-roles/user/{userId}:
 *   get:
 *     tags: [User Roles]
 *     summary: Get roles for a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: number
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: Roles assigned to user
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/user/:userId",
  authenticate,
  checkRole('admin'),
  userRoleController.findByUserId.bind(userRoleController)
);

/**
 * @swagger
 * /user-roles/role/{roleId}:
 *   get:
 *     tags: [User Roles]
 *     summary: Get users that have a role
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: number
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: Users with the role
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/role/:roleId",
  authenticate,
  checkRole('admin'),
  userRoleController.findByRoleId.bind(userRoleController)
);

/**
 * @swagger
 * /user-roles/check:
 *   get:
 *     tags: [User Roles]
 *     summary: Check if user has role
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: roleId
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Role status
 */
router.get("/check",
  authenticate,
  checkRole('admin'),
  userRoleController.hasRole.bind(userRoleController)
);

/**
 * @swagger
 * /user-roles/{userId}/{roleId}:
 *   delete:
 *     tags: [User Roles]
 *     summary: Remove role from user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: number
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete("/:userId/:roleId",
  authenticate,
  checkRole('admin'),
  userRoleController.deleteByUserIdAndRoleId.bind(userRoleController)
);

export default router;
