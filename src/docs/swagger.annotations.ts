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
 *           description: User ID
 *         username:
 *           type: string
 *           maxLength: 50
 *           description: Username for the account
 *         email:
 *           type: string
 *           maxLength: 100
 *           description: User email address
 *         password:
 *           type: string
 *           maxLength: 255
 *           description: Hashed password
 *         isEmailVerified:
 *           type: boolean
 *           default: false
 *           description: Whether the email is verified
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
 *           description: Profile ID
 *         userId:
 *           type: integer
 *           description: ID of the user this profile belongs to
 *         avatarUrl:
 *           type: string
 *           maxLength: 255
 *           description: URL to user avatar image
 *         dob:
 *           type: string
 *           format: date
 *           description: Date of birth
 *         phoneNumber:
 *           type: string
 *           maxLength: 20
 *           description: User phone number
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
 *           description: Tournament ID
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Tournament name
 *         status:
 *           type: string
 *           enum: [upcoming, ongoing, completed]
 *           default: upcoming
 *           description: Current status of the tournament
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Tournament start date and time
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Tournament end date and time (optional)
 *         location:
 *           type: string
 *           maxLength: 100
 *           description: Tournament venue location
 *         createdBy:
 *           type: integer
 *           description: ID of the user who created this tournament
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
 *         - type
 *         - maxEntries
 *         - maxSets
 *         - racketCheck
 *       properties:
 *         id:
 *           type: integer
 *           description: Content ID
 *         tournamentId:
 *           type: integer
 *           description: ID of the tournament this content belongs to
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Name of the tournament content (e.g., Men's Singles, Women's Doubles)
 *         type:
 *           type: string
 *           enum: [single, team, double]
 *           description: Type of tournament content
 *         maxEntries:
 *           type: integer
 *           description: Maximum number of entries allowed
 *         maxSets:
 *           type: integer
 *           description: Maximum number of sets per match
 *         numberOfSingles:
 *           type: integer
 *           description: Number of singles matches (for team type)
 *         numberOfDoubles:
 *           type: integer
 *           description: Number of doubles matches (for team type)
 *         racketCheck:
 *           type: boolean
 *           description: Whether racket check is required
 *         isGroupStage:
 *           type: boolean
 *           description: Whether this content has a group stage
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
 *           description: Entry ID
 *         contentId:
 *           type: integer
 *           description: ID of the tournament content this entry belongs to
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Name of the entry/team
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
 *           description: Match ID
 *         scheduleId:
 *           type: integer
 *           description: ID of the schedule this match belongs to
 *         entryAId:
 *           type: integer
 *           description: ID of entry A (first competitor)
 *         entryBId:
 *           type: integer
 *           description: ID of entry B (second competitor)
 *         status:
 *           type: string
 *           enum: [scheduled, in_progress, completed, cancelled]
 *           description: Current status of the match
 *         winnerEntryId:
 *           type: integer
 *           description: ID of the winning entry
 *         umpire:
 *           type: integer
 *           description: ID of the umpire
 *         assistantUmpire:
 *           type: integer
 *           description: ID of the assistant umpire
 *         coachAId:
 *           type: integer
 *           description: ID of coach for entry A
 *         coachBId:
 *           type: integer
 *           description: ID of coach for entry B
 *         isConfirmedByWinner:
 *           type: boolean
 *           description: Whether the result is confirmed by winner
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

