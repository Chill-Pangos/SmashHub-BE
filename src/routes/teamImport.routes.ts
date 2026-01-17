import { Router } from "express";
import teamImportController from "../controllers/teamImport.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { uploadExcel } from "../middlewares/upload.middleware";

const router = Router();

/**
 * @swagger
 * /teams/import/preview:
 *   post:
 *     summary: Preview Excel import data for teams and members
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file (.xlsx or .xls) containing teams and members data
 *     responses:
 *       200:
 *         description: Excel file parsed and validated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                       example: true
 *                     teams:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "Team Alpha"
 *                           description:
 *                             type: string
 *                             example: "Best team"
 *                           members:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 teamName:
 *                                   type: string
 *                                   example: "Team Alpha"
 *                                 memberName:
 *                                   type: string
 *                                   example: "John Doe"
 *                                 userId:
 *                                   type: number
 *                                   example: 1
 *                                 role:
 *                                   type: string
 *                                   example: "team_manager"
 *                                 email:
 *                                   type: string
 *                                   example: "john@example.com"
 *                           rowNumber:
 *                             type: number
 *                             example: 2
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rowNumber:
 *                             type: number
 *                             example: 5
 *                           field:
 *                             type: string
 *                             example: "email"
 *                           message:
 *                             type: string
 *                             example: "Email không hợp lệ"
 *                           value:
 *                             type: string
 *                             example: "invalid-email"
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalTeams:
 *                           type: number
 *                           example: 5
 *                         totalMembers:
 *                           type: number
 *                           example: 20
 *                         teamsWithErrors:
 *                           type: number
 *                           example: 0
 *                         membersWithErrors:
 *                           type: number
 *                           example: 0
 *       400:
 *         description: Invalid file or validation errors
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/import/preview",
  authenticate,
  uploadExcel.single('file'),
  teamImportController.previewImport.bind(teamImportController)
);

/**
 * @swagger
 * /teams/import/confirm:
 *   post:
 *     summary: Confirm and save imported teams and members
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournamentId
 *               - teams
 *             properties:
 *               tournamentId:
 *                 type: number
 *                 example: 1
 *               teams:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Team Alpha"
 *                     description:
 *                       type: string
 *                       example: "Best team"
 *                     members:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           teamName:
 *                             type: string
 *                             example: "Team Alpha"
 *                           memberName:
 *                             type: string
 *                             example: "John Doe"
 *                           userId:
 *                             type: number
 *                             example: 1
 *                           role:
 *                             type: string
 *                             example: "team_manager"
 *                           email:
 *                             type: string
 *                             example: "john@example.com"
 *                     rowNumber:
 *                       type: number
 *                       example: 2
 *     responses:
 *       201:
 *         description: Teams and members created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Teams imported successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     createdTeams:
 *                       type: number
 *                       example: 5
 *                     createdMembers:
 *                       type: number
 *                       example: 20
 *                     teamIds:
 *                       type: array
 *                       items:
 *                         type: number
 *                       example: [1, 2, 3, 4, 5]
 *       400:
 *         description: Invalid data or import failed
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/import/confirm",
  authenticate,
  teamImportController.confirmImport.bind(teamImportController)
);

export default router;
