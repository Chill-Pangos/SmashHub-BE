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
 *     description: |
 *       Create a many-to-many relationship between a role and a permission.
 *       This endpoint allows admins to grant permissions to specific roles.
 *       Only administrators can assign permissions to roles.
 *       Each role-permission combination must be unique (duplicate assignments are rejected with 409 Conflict).
 *     operationId: assignPermissionToRole
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       description: Role-permission assignment data
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *               - permissionId
 *             properties:
 *               roleId:
 *                 type: integer
 *                 example: 1
 *                 description: ID of the role to assign the permission to
 *               permissionId:
 *                 type: integer
 *                 example: 5
 *                 description: ID of the permission to assign
 *           examples:
 *             example1:
 *               summary: Assign create_tournament permission to admin role
 *               value:
 *                 roleId: 1
 *                 permissionId: 5
 *     responses:
 *       201:
 *         description: Permission successfully assigned to role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RolePermission'
 *             example:
 *               id: 123
 *               roleId: 1
 *               permissionId: 5
 *               createdAt: "2026-05-28T10:30:00Z"
 *               updatedAt: "2026-05-28T10:30:00Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         description: Role or permission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               roleNotFound:
 *                 value:
 *                   message: "Role not found"
 *               permissionNotFound:
 *                 value:
 *                   message: "Permission not found"
 *       409:
 *         description: Permission already assigned to role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Permission already assigned to role"
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 *   get:
 *     tags: [Role Permissions]
 *     summary: List all role-permission assignments
 *     description: |
 *       Retrieve all role-permission relationships with pagination.
 *       Returns assignments with associated role and permission details.
 *       Only administrators can view all assignments.
 *     operationId: listAllRolePermissions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of role-permission assignments with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rolePermissions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RolePermission'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *             example:
 *               rolePermissions:
 *                 - id: 123
 *                   roleId: 1
 *                   permissionId: 5
 *                   role:
 *                     id: 1
 *                     name: admin
 *                   permission:
 *                     id: 5
 *                     name: create_tournament
 *                   createdAt: "2026-05-28T10:30:00Z"
 *                   updatedAt: "2026-05-28T10:30:00Z"
 *               pagination:
 *                 total: 45
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 5
 *                 hasNextPage: true
 *                 hasPrevPage: false
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
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
 *     description: |
 *       Retrieve all permissions assigned to a specific role with pagination.
 *       This helps understand what actions a role can perform in the system.
 *       Only administrators can query role permissions.
 *     operationId: getPermissionsByRole
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the role to query
 *         example: 1
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: Permissions assigned to the role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rolePermissions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RolePermission'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *             example:
 *               rolePermissions:
 *                 - id: 123
 *                   roleId: 1
 *                   permissionId: 5
 *                   permission:
 *                     id: 5
 *                     name: create_tournament
 *                   createdAt: "2026-05-28T10:30:00Z"
 *                   updatedAt: "2026-05-28T10:30:00Z"
 *               pagination:
 *                 total: 12
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 2
 *                 hasNextPage: true
 *                 hasPrevPage: false
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         description: Role not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Role not found"
 *       500:
 *         $ref: '#/components/responses/InternalError500'
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
 *     summary: Get roles with a permission
 *     description: |
 *       Retrieve all roles that have been granted a specific permission with pagination.
 *       This helps identify which roles can perform a particular action in the system.
 *       Only administrators can query role assignments by permission.
 *     operationId: getRolesByPermission
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the permission to query
 *         example: 5
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: Roles that have the specified permission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rolePermissions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RolePermission'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *             example:
 *               rolePermissions:
 *                 - id: 123
 *                   roleId: 1
 *                   permissionId: 5
 *                   role:
 *                     id: 1
 *                     name: admin
 *                   createdAt: "2026-05-28T10:30:00Z"
 *                   updatedAt: "2026-05-28T10:30:00Z"
 *               pagination:
 *                 total: 3
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 1
 *                 hasNextPage: false
 *                 hasPrevPage: false
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         description: Permission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Permission not found"
 *       500:
 *         $ref: '#/components/responses/InternalError500'
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
 *     description: |
 *       Verify whether a specific role has been granted a particular permission.
 *       Returns a boolean result indicating the permission status.
 *       Useful for validation and authorization checking.
 *     operationId: checkRolePermission
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the role to check
 *         example: 1
 *       - in: query
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the permission to check
 *         example: 5
 *     responses:
 *       200:
 *         description: Permission status check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasPermission:
 *                   type: boolean
 *                   description: Whether the role has the specified permission
 *             examples:
 *               hasPermission:
 *                 value:
 *                   hasPermission: true
 *               noPermission:
 *                 value:
 *                   hasPermission: false
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
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
 *     description: |
 *       Revoke a permission from a role by deleting the many-to-many relationship.
 *       This prevents the role from performing the specified action.
 *       Only administrators can remove permissions from roles.
 *       Returns 204 No Content on successful deletion.
 *     operationId: removePermissionFromRole
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the role
 *         example: 1
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the permission to remove
 *         example: 5
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent204'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         description: Role-permission assignment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Role-permission assignment not found"
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.delete("/:roleId/:permissionId",
  authenticate,
  checkRole('admin'),
  rolePermissionController.deleteByRoleIdAndPermissionId.bind(rolePermissionController)
);

export default router;