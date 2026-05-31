import { Router } from "express";
import entryMemberController from "../controllers/entryMember.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { checkPermission } from "../middlewares/permission.middleware";

const router = Router({ mergeParams: true }); // mergeParams để nhận :entryId từ parent route

/**
 * @swagger
 * /entries/{entryId}/members:
 *   get:
 *     tags: [Entry Members]
 *     summary: Get all members of entry with pagination
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of team members with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 members:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EntryMember'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       404:
 *         $ref: '#/components/responses/NotFound404'
 *       500:
 *         $ref: '#/components/responses/InternalError500'
 *   post:
 *     tags: [Entry Members]
 *     summary: Add member to entry (captain only)
 *     description: |
 *       User must be eligible (gender, age, ELO), not already registered in category,
 *       team must not be full, registration window must be open.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newMemberId]
 *             properties:
 *               newMemberId:
 *                 type: integer
 *           examples:
 *             example1:
 *               value:
 *                 newMemberId: 42
 *     responses:
 *       201:
 *         description: Member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EntryMember'
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
router.get("/", entryMemberController.getAllMembers.bind(entryMemberController));
router.post(
  "/",
  authenticate,
  checkPermission("entries:update"),
  entryMemberController.addMember.bind(entryMemberController),
);

/**
 * @swagger
 * /entries/{entryId}/members/me:
 *   delete:
 *     tags: [Entry Members]
 *     summary: Leave entry (member only)
 *     description: |
 *       Leave a team as a member during the registration period.
 *       Captain cannot leave (must transfer captaincy or delete entry).
 *       Automatically reopens team for new members if it was full.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: integer
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
router.delete(
  "/me",
  authenticate,
  entryMemberController.leaveEntry.bind(entryMemberController),
);

/**
 * @swagger
 * /entries/{entryId}/members/{memberId}:
 *   delete:
 *     tags: [Entry Members]
 *     summary: Remove member from entry (captain only)
 *     description: |
 *       Captain removes a member during registration period.
 *       Cannot remove the captain. Automatically reopens team if it was full.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: integer
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
router.delete(
  "/:memberId",
  authenticate,
  checkPermission("entries:update"),
  entryMemberController.removeMember.bind(entryMemberController),
);

export default router;