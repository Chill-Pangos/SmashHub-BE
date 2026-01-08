import { Router } from "express";
import contentRuleController from "../controllers/contentRule.controller";

const router = Router();

/**
 * @swagger
 * /content-rules:
 *   post:
 *     tags: [Content Rules]
 *     summary: Create a new content rule
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Content rule created successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     tags: [Content Rules]
 *     summary: Get all content rules
 *     parameters:
 *       - $ref: '#/components/parameters/skipParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: List of content rules
 */
router.post("/", contentRuleController.create.bind(contentRuleController));
router.get("/", contentRuleController.findAll.bind(contentRuleController));

/**
 * @swagger
 * /content-rules/{id}:
 *   get:
 *     tags: [Content Rules]
 *     summary: Get content rule by ID
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Content rule details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     tags: [Content Rules]
 *     summary: Update content rule
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Content rule updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Content Rules]
 *     summary: Delete content rule
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       204:
 *         $ref: '#/components/responses/NoContent'
 */
router.get("/:id", contentRuleController.findById.bind(contentRuleController));
router.put("/:id", contentRuleController.update.bind(contentRuleController));
router.delete("/:id", contentRuleController.delete.bind(contentRuleController));

/**
 * @swagger
 * /content-rules/content/{contentId}:
 *   get:
 *     tags: [Content Rules]
 *     summary: Get content rule by content ID
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Content rule details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  "/content/:contentId",
  contentRuleController.findByContentId.bind(contentRuleController)
);

export default router;
