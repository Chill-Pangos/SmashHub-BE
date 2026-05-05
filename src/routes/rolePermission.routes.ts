import { Router } from "express";
import rolePermissionController from "../controllers/rolePermission.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/permission.middleware";

const router = Router();

/**
 * @swagger
 * /role-permissions:
 *   post:
 *     tags: [Role Permissions]
 *     summary: Assign permission to role
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roleId:
 *                 type: number
 *               permissionId:
 *                 type: number
 *     responses:
 *       201:
 *         description: Permission assigned to role
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Role Permissions]
 *     summary: Get all role-permission assignments
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of role-permission assignments
 */
router.post("/",
  authenticate,
  checkRole('admin'),
  rolePermissionController.create.bind(rolePermissionController)
);
router.get("/",
  authenticate,
  checkRole('admin'),
  rolePermissionController.findAll.bind(rolePermissionController)
);

/**
 * @swagger
 * /role-permissions/role/{roleId}:
 *   get:
 *     tags: [Role Permissions]
 *     summary: Get permissions for a role
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
 *         description: Permissions assigned to role
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/role/:roleId",
  authenticate,
  checkRole('admin'),
  rolePermissionController.findByRoleId.bind(rolePermissionController)
);

/**
 * @swagger
 * /role-permissions/permission/{permissionId}:
 *   get:
 *     tags: [Role Permissions]
 *     summary: Get roles that have a permission
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: number
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: Roles with the permission
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/permission/:permissionId",
  authenticate,
  checkRole('admin'),
  rolePermissionController.findByPermissionId.bind(rolePermissionController)
);

/**
 * @swagger
 * /role-permissions/check:
 *   get:
 *     tags: [Role Permissions]
 *     summary: Check if role has permission
 *     parameters:
 *       - in: query
 *         name: roleId
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Permission status
 */
router.get("/check",
  authenticate,
  checkRole('admin'),
  rolePermissionController.hasPermission.bind(rolePermissionController)
);

/**
 * @swagger
 * /role-permissions/{roleId}/{permissionId}:
 *   delete:
 *     tags: [Role Permissions]
 *     summary: Remove permission from role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: number
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete("/:roleId/:permissionId",
  authenticate,
  checkRole('admin'),
  rolePermissionController.deleteByRoleIdAndPermissionId.bind(rolePermissionController)
);

export default router;