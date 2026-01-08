/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: integer
 *         username:
 *           type: string
 *           maxLength: 50
 *         email:
 *           type: string
 *           maxLength: 100
 *         password:
 *           type: string
 *           maxLength: 255
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Profile:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         avatarUrl:
 *           type: string
 *           maxLength: 255
 *         dob:
 *           type: string
 *           format: date
 *         phoneNumber:
 *           type: string
 *           maxLength: 20
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Role:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *           maxLength: 50
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Permission:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *           maxLength: 100
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     UserRole:
 *       type: object
 *       required:
 *         - userId
 *         - roleId
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         roleId:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     RolePermission:
 *       type: object
 *       required:
 *         - roleId
 *         - permissionId
 *       properties:
 *         id:
 *           type: integer
 *         roleId:
 *           type: integer
 *         permissionId:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Tournament:
 *       type: object
 *       required:
 *         - name
 *         - startDate
 *         - location
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *           maxLength: 100
 *         status:
 *           type: string
 *           enum: [upcoming, ongoing, completed]
 *           default: upcoming
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         location:
 *           type: string
 *           maxLength: 100
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     FormatType:
 *       type: object
 *       required:
 *         - typeName
 *       properties:
 *         id:
 *           type: integer
 *         typeName:
 *           type: string
 *           maxLength: 100
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     TournamentContent:
 *       type: object
 *       required:
 *         - tournamentId
 *         - name
 *         - formatTypeId
 *       properties:
 *         id:
 *           type: integer
 *         tournamentId:
 *           type: integer
 *         name:
 *           type: string
 *           maxLength: 100
 *         formatTypeId:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Entry:
 *       type: object
 *       required:
 *         - contentId
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *         contentId:
 *           type: integer
 *         name:
 *           type: string
 *           maxLength: 100
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     EntryMember:
 *       type: object
 *       required:
 *         - entryId
 *         - userId
 *       properties:
 *         id:
 *           type: integer
 *         entryId:
 *           type: integer
 *         userId:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Schedule:
 *       type: object
 *       required:
 *         - contentId
 *         - scheduledAt
 *       properties:
 *         id:
 *           type: integer
 *         contentId:
 *           type: integer
 *         roundNumber:
 *           type: integer
 *         groupName:
 *           type: string
 *           maxLength: 50
 *         scheduledAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Match:
 *       type: object
 *       required:
 *         - scheduleId
 *         - entryAId
 *         - entryBId
 *         - status
 *       properties:
 *         id:
 *           type: integer
 *         scheduleId:
 *           type: integer
 *         entryAId:
 *           type: integer
 *         entryBId:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [scheduled, in_progress, completed, cancelled]
 *         winnerEntryId:
 *           type: integer
 *         umpire:
 *           type: integer
 *         assistantUmpire:
 *           type: integer
 *         coachAId:
 *           type: integer
 *         coachBId:
 *           type: integer
 *         isConfirmedByWinner:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     MatchSet:
 *       type: object
 *       required:
 *         - matchId
 *         - setNumber
 *       properties:
 *         id:
 *           type: integer
 *         matchId:
 *           type: integer
 *         setNumber:
 *           type: integer
 *         entryAScore:
 *           type: integer
 *           default: 0
 *         entryBScore:
 *           type: integer
 *           default: 0
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     MatchFormat:
 *       type: object
 *       required:
 *         - numberOfSingles
 *         - numberOfDoubles
 *       properties:
 *         id:
 *           type: integer
 *         numberOfSingles:
 *           type: integer
 *         numberOfDoubles:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ContentRule:
 *       type: object
 *       required:
 *         - contentId
 *         - maxEntries
 *         - maxSets
 *         - racketCheck
 *       properties:
 *         id:
 *           type: integer
 *         contentId:
 *           type: integer
 *         matchFormatId:
 *           type: integer
 *         maxEntries:
 *           type: integer
 *         maxSets:
 *           type: integer
 *         racketCheck:
 *           type: boolean
 *         isGroupStage:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     EloScore:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         id:
 *           type: integer
 *         userId:
 *           type: integer
 *         score:
 *           type: integer
 *           default: 1000
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     EloHistory:
 *       type: object
 *       required:
 *         - matchId
 *         - userId
 *         - previousElo
 *         - newElo
 *         - changeReason
 *       properties:
 *         id:
 *           type: integer
 *         matchId:
 *           type: integer
 *         userId:
 *           type: integer
 *         previousElo:
 *           type: integer
 *         newElo:
 *           type: integer
 *         changeReason:
 *           type: string
 *           maxLength: 255
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Complaint:
 *       type: object
 *       required:
 *         - createdBy
 *         - tournamentId
 *         - topic
 *         - description
 *       properties:
 *         id:
 *           type: integer
 *         createdBy:
 *           type: integer
 *         tournamentId:
 *           type: integer
 *         matchId:
 *           type: integer
 *         topic:
 *           type: string
 *           maxLength: 255
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [submitted, under_review, escalated, resolved, rejected]
 *           default: submitted
 *         currentHandlerId:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ComplaintMessage:
 *       type: object
 *       required:
 *         - complaintId
 *         - senderId
 *         - message
 *       properties:
 *         id:
 *           type: integer
 *         complaintId:
 *           type: integer
 *         senderId:
 *           type: integer
 *         receiverId:
 *           type: integer
 *         message:
 *           type: string
 *         messageType:
 *           type: string
 *           enum: [comment, request_info, response]
 *           default: comment
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ComplaintWorkflow:
 *       type: object
 *       required:
 *         - complaintId
 *       properties:
 *         id:
 *           type: integer
 *         complaintId:
 *           type: integer
 *         fromRole:
 *           type: string
 *           maxLength: 50
 *         toRole:
 *           type: string
 *           maxLength: 50
 *         fromUserId:
 *           type: integer
 *         toUserId:
 *           type: integer
 *         action:
 *           type: string
 *           enum: [submit, forward, approve, reject, request_info]
 *         note:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 * tags:
 *   - name: Users
 *     description: User management
 *   - name: Profiles
 *     description: User profiles
 *   - name: Tournaments
 *     description: Tournament management
 *   - name: Matches
 *     description: Match management
 *   - name: ELO Scores
 *     description: ELO scoring system
 *   - name: Complaints
 *     description: Complaint system
 */

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
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 *   put:
 *     tags: [Users]
 *     summary: Update user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 *   delete:
 *     tags: [Users]
 *     summary: Delete user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: User deleted
 *       404:
 *         description: User not found
 *
 * /tournaments:
 *   post:
 *     tags: [Tournaments]
 *     summary: Create a new tournament
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tournament'
 *     responses:
 *       201:
 *         description: Tournament created
 *   get:
 *     tags: [Tournaments]
 *     summary: Get all tournaments
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of tournaments
 *
 * /tournaments/{id}:
 *   get:
 *     tags: [Tournaments]
 *     summary: Get tournament by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tournament details
 *       404:
 *         description: Not found
 *   put:
 *     tags: [Tournaments]
 *     summary: Update tournament
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tournament updated
 *   delete:
 *     tags: [Tournaments]
 *     summary: Delete tournament
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Tournament deleted
 *
 * /tournaments/status/{status}:
 *   get:
 *     tags: [Tournaments]
 *     summary: Get tournaments by status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [upcoming, ongoing, completed]
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tournaments by status
 *
 * /elo-scores/leaderboard:
 *   get:
 *     tags: [ELO Scores]
 *     summary: Get ELO leaderboard
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: ELO leaderboard
 *
 * /complaints:
 *   post:
 *     tags: [Complaints]
 *     summary: Create a new complaint
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Complaint'
 *     responses:
 *       201:
 *         description: Complaint created
 *   get:
 *     tags: [Complaints]
 *     summary: Get all complaints
 *     parameters:
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of complaints
 *
 * /complaints/user/{userId}:
 *   get:
 *     tags: [Complaints]
 *     summary: Get complaints by user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User complaints
 *
 * /complaint-messages/{id}/read:
 *   patch:
 *     tags: [Complaint Messages]
 *     summary: Mark complaint message as read
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Message marked as read
 *       404:
 *         description: Message not found
 */
