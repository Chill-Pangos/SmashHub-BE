import { Router } from "express";
import roleController from "../controllers/role.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router();

/**
 * @swagger
 * /roles:
 *   post:
 *     tags: [Roles]
 *     summary: Create a new role
 *     description: Creates a new role with the specified name and description. Requires admin privileges.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *                 description: Unique role name (required, max 50 characters)
 *                 example: "tournament_organizer"
 *               description:
 *                 type: string
 *                 description: Role description and purpose (optional)
 *                 example: "Manages tournament creation and participant entries"
 *           examples:
 *             basic:
 *               summary: Basic role creation
 *               value:
 *                 name: "tournament_organizer"
 *                 description: "Manages tournament creation and participant entries"
 *             minimal:
 *               summary: Minimal role creation
 *               value:
 *                 name: "referee"
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 *             example:
 *               id: 5
 *               name: "tournament_organizer"
 *               description: "Manages tournament creation and participant entries"
 *               createdAt: "2026-05-28T10:30:00Z"
 *               updatedAt: "2026-05-28T10:30:00Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       409:
 *         $ref: '#/components/responses/Conflict409'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 *   get:
 *     tags: [Roles]
 *     summary: List all roles with pagination
 *     description: Retrieves a paginated list of all roles. Requires admin privileges. Results are sorted by creation date in descending order.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination (starting from 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of roles to return per page
 *     responses:
 *       200:
 *         description: List of roles with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Role'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of roles
 *                       example: 25
 *                     page:
 *                       type: integer
 *                       description: Current page number
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       description: Number of items per page
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       description: Total number of pages
 *                       example: 3
 *                     hasNextPage:
 *                       type: boolean
 *                       description: Whether next page exists
 *                       example: true
 *                     hasPrevPage:
 *                       type: boolean
 *                       description: Whether previous page exists
 *                       example: false
 *             example:
 *               roles:
 *                 - id: 1
 *                   name: "admin"
 *                   description: "Full system access"
 *                   createdAt: "2026-01-01T00:00:00Z"
 *                   updatedAt: "2026-01-01T00:00:00Z"
 *                 - id: 2
 *                   name: "tournament_organizer"
 *                   description: "Manages tournament creation and entries"
 *                   createdAt: "2026-02-15T14:30:00Z"
 *                   updatedAt: "2026-02-15T14:30:00Z"
 *               pagination:
 *                 total: 25
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 3
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
  checkPermission('roles:create'),
  roleController.create.bind(roleController)
);
router.get("/",
  authenticate,
  checkPermission('roles:view'),
  roleController.findAll.bind(roleController)
);

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     tags: [Roles]
 *     summary: Get role by ID
 *     description: Retrieves a specific role by its ID. Requires admin privileges.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 *             example:
 *               id: 2
 *               name: "tournament_organizer"
 *               description: "Manages tournament creation and participant entries"
 *               createdAt: "2026-02-15T14:30:00Z"
 *               updatedAt: "2026-02-15T14:30:00Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 *   patch:
 *     tags: [Roles]
 *     summary: Update role
 *     description: Updates an existing role's name and/or description. Requires admin privileges. Role name must be unique.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *                 description: Updated unique role name (optional, max 50 characters)
 *                 example: "event_organizer"
 *               description:
 *                 type: string
 *                 description: Updated role description (optional)
 *                 example: "Manages event planning and tournament coordination"
 *           examples:
 *             updateName:
 *               summary: Update only the name
 *               value:
 *                 name: "event_organizer"
 *             updateDescription:
 *               summary: Update only the description
 *               value:
 *                 description: "Updated description for the role"
 *             updateBoth:
 *               summary: Update both name and description
 *               value:
 *                 name: "event_organizer"
 *                 description: "Manages event planning and tournament coordination"
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 *             example:
 *               id: 2
 *               name: "event_organizer"
 *               description: "Manages event planning and tournament coordination"
 *               createdAt: "2026-02-15T14:30:00Z"
 *               updatedAt: "2026-05-28T15:45:00Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       409:
 *         $ref: '#/components/responses/Conflict409'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 *   delete:
 *     tags: [Roles]
 *     summary: Delete role
 *     description: Permanently deletes a role from the system. Requires admin privileges. This action cannot be undone.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Role ID
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent204'
 *       400:
 *         $ref: '#/components/responses/BadRequest400'
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get("/:id",
  authenticate,
  checkPermission('roles:view'),
  roleController.findById.bind(roleController)
);
router.patch("/:id",
  authenticate,
  checkPermission('roles:update'),
  roleController.update.bind(roleController)
);
router.delete("/:id",
  authenticate,
  checkPermission('roles:delete'),
  roleController.delete.bind(roleController)
);

/**
 * @swagger
 * /roles/name/{name}:
 *   get:
 *     tags: [Roles]
 *     summary: Get role by name
 *     description: Retrieves a specific role by its unique name. Requires admin privileges.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Role name (exact match, case-sensitive)
 *     responses:
 *       200:
 *         description: Role details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Role'
 *             example:
 *               id: 1
 *               name: "admin"
 *               description: "Full system access"
 *               createdAt: "2026-01-01T00:00:00Z"
 *               updatedAt: "2026-01-01T00:00:00Z"
 *       401:
 *         $ref: '#/components/responses/Unauthorized401'
 *       403:
 *         $ref: '#/components/responses/Forbidden403'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 */
router.get("/name/:name",
  authenticate,
  checkPermission('roles:view'),
  roleController.findByName.bind(roleController)
);

export default router;
