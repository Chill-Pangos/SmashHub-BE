import { Router } from "express";
import entryImportController from "../controllers/entryImport.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { uploadExcel } from "../middlewares/upload.middleware";

const router = Router();

/**
 * @swagger
 * /entries/import/preview:
 *   post:
 *     summary: Preview Excel import data for single entries
 *     tags: [Entries]
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
 *               - contentId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file (.xlsx or .xls) containing entries data
 *               contentId:
 *                 type: integer
 *                 description: ID of the tournament content (must be type 'single')
 *                 example: 1
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
 *                     entries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           userId:
 *                             type: number
 *                             example: 1
 *                           email:
 *                             type: string
 *                             example: "john@example.com"
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
 *                             example: "Invalid email format"
 *                           value:
 *                             type: string
 *                             example: "invalid-email"
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalEntries:
 *                           type: number
 *                           example: 10
 *                         entriesWithErrors:
 *                           type: number
 *                           example: 0
 *                         contentType:
 *                           type: string
 *                           example: "single"
 *                         maxEntries:
 *                           type: number
 *                           example: 32
 *                         currentEntries:
 *                           type: number
 *                           example: 5
 *                         availableSlots:
 *                           type: number
 *                           example: 27
 *       400:
 *         description: Invalid file or validation errors
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/import/preview",
  authenticate,
  uploadExcel.single('file'),
  entryImportController.previewSingleEntries.bind(entryImportController)
);

/**
 * @swagger
 * /entries/import/confirm:
 *   post:
 *     summary: Confirm and save imported entries
 *     tags: [Entries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentId
 *               - entries
 *             properties:
 *               contentId:
 *                 type: number
 *                 example: 1
 *               entries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     userId:
 *                       type: number
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                     rowNumber:
 *                       type: number
 *                       example: 2
 *     responses:
 *       201:
 *         description: Entries created successfully
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
 *                   example: "Entries imported successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     createdEntries:
 *                       type: number
 *                       example: 10
 *                     entryIds:
 *                       type: array
 *                       items:
 *                         type: number
 *                       example: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
 *       400:
 *         description: Invalid data or import failed
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/import/confirm",
  authenticate,
  entryImportController.confirmSingleEntries.bind(entryImportController)
);

/**
 * @swagger
 * /entries/import/double/preview:
 *   post:
 *     summary: Preview Excel import data for double entries
 *     tags: [Entries]
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
 *               - contentId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file (.xlsx or .xls) with double entries (5 columns STT, Player1 Name, Email, Player2 Name, Email)
 *               contentId:
 *                 type: integer
 *                 description: ID of the tournament content (must be type 'double')
 *                 example: 2
 *     responses:
 *       200:
 *         description: Excel file parsed and validated successfully
 *       400:
 *         description: Invalid file or validation errors
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/import/double/preview",
  authenticate,
  uploadExcel.single('file'),
  entryImportController.previewDoubleEntries.bind(entryImportController)
);

/**
 * @swagger
 * /entries/import/double/confirm:
 *   post:
 *     summary: Confirm and save imported double entries
 *     tags: [Entries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentId
 *               - entries
 *             properties:
 *               contentId:
 *                 type: number
 *                 example: 2
 *               entries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     player1Name:
 *                       type: string
 *                       example: "John Doe"
 *                     player1UserId:
 *                       type: number
 *                       example: 1
 *                     player1Email:
 *                       type: string
 *                       example: "john@example.com"
 *                     player1TeamId:
 *                       type: number
 *                       nullable: true
 *                       example: 1
 *                     player2Name:
 *                       type: string
 *                       example: "Jane Smith"
 *                     player2UserId:
 *                       type: number
 *                       example: 2
 *                     player2Email:
 *                       type: string
 *                       example: "jane@example.com"
 *                     player2TeamId:
 *                       type: number
 *                       nullable: true
 *                       example: 1
 *                     rowNumber:
 *                       type: number
 *                       example: 2
 *     responses:
 *       201:
 *         description: Double entries created successfully
 *       400:
 *         description: Invalid data or import failed
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/import/double/confirm",
  authenticate,
  entryImportController.confirmDoubleEntries.bind(entryImportController)
);

export default router;
