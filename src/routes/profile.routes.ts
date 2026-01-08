import { Router } from "express";
import profileController from "../controllers/profile.controller";

const router = Router();

/**
 * @swagger
 * /profiles:
 *   post:
 *     tags: [Profiles]
 *     summary: Create a new profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Profile created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Profiles]
 *     summary: Get all profiles
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of profiles
 */
router.post("/", profileController.create.bind(profileController));
router.get("/", profileController.findAll.bind(profileController));

/**
 * @swagger
 * /profiles/{id}:
 *   get:
 *     tags: [Profiles]
 *     summary: Get profile by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Profile details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Profiles]
 *     summary: Update profile
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Profile updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Profiles]
 *     summary: Delete profile
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", profileController.findById.bind(profileController));
router.put("/:id", profileController.update.bind(profileController));
router.delete("/:id", profileController.delete.bind(profileController));

/**
 * @swagger
 * /profiles/user/{userId}:
 *   get:
 *     tags: [Profiles]
 *     summary: Get profile by user ID
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Profile details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/user/:userId",
  profileController.findByUserId.bind(profileController)
);

export default router;
