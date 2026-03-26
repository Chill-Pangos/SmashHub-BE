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
 *         gender:
 *           type: string
 *           enum: [male, female, other]
 *           description: User gender
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
 *         description:
 *           type: string
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
 *         - tier
 *         - startDate
 *         - location
 *         - createdBy
 *       properties:
 *         id:
 *           type: integer
 *           description: Tournament ID
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Tournament name
 *         tier:
 *           type: integer
 *           description: Tournament tier level
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
 *         numberOfTables:
 *           type: integer
 *           default: 1
 *           description: Number of tables available for concurrent matches
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
 *     TournamentCategory:
 *       type: object
 *       required:
 *         - tournamentId
 *         - name
 *         - type
 *         - maxEntries
 *         - maxSets
 *       properties:
 *         id:
 *           type: integer
 *           description: Category ID
 *         tournamentId:
 *           type: integer
 *           description: ID of the tournament this category belongs to
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Name of the tournament category (e.g., Men's Singles, Women's Doubles)
 *         type:
 *           type: string
 *           enum: [single, team, double]
 *           description: Type of tournament category
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
 *         minAge:
 *           type: integer
 *           description: Minimum age requirement
 *         maxAge:
 *           type: integer
 *           description: Maximum age requirement
 *         minElo:
 *           type: integer
 *           description: Minimum ELO requirement
 *         maxElo:
 *           type: integer
 *           description: Maximum ELO requirement
 *         gender:
 *           type: string
 *           enum: [male, female, mixed]
 *           description: Gender requirement (male, female, or mixed)
 *         isGroupStage:
 *           type: boolean
 *           description: Whether this category has a group stage
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
 *         - categoryId
 *         - teamId
 *       properties:
 *         id:
 *           type: integer
 *           description: Entry ID
 *         categoryId:
 *           type: integer
 *           description: ID of the tournament category this entry belongs to
 *         teamId:
 *           type: integer
 *           description: ID of the team this entry belongs to
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
 *         - eloAtEntry
 *       properties:
 *         id:
 *           type: integer
 *         entryId:
 *           type: integer
 *         userId:
 *           type: integer
 *         eloAtEntry:
 *           type: integer
 *           description: Player ELO snapshot at registration time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Team:
 *       type: object
 *       required:
 *         - tournamentId
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *         tournamentId:
 *           type: integer
 *         name:
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
 *     TeamMember:
 *       type: object
 *       required:
 *         - teamId
 *         - userId
 *       properties:
 *         id:
 *           type: integer
 *         teamId:
 *           type: integer
 *         userId:
 *           type: integer
 *         role:
 *           type: string
 *           enum: [member, captain]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     GroupStanding:
 *       type: object
 *       required:
 *         - categoryId
 *         - groupName
 *         - entryId
 *       properties:
 *         id:
 *           type: integer
 *         categoryId:
 *           type: integer
 *         groupName:
 *           type: string
 *           maxLength: 50
 *         entryId:
 *           type: integer
 *         matchesPlayed:
 *           type: integer
 *           default: 0
 *         matchesWon:
 *           type: integer
 *           default: 0
 *         matchesLost:
 *           type: integer
 *           default: 0
 *         setsWon:
 *           type: integer
 *           default: 0
 *         setsLost:
 *           type: integer
 *           default: 0
 *         setsDiff:
 *           type: integer
 *           default: 0
 *         position:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     TournamentReferee:
 *       type: object
 *       required:
 *         - tournamentId
 *         - refereeId
 *         - role
 *       properties:
 *         id:
 *           type: integer
 *         tournamentId:
 *           type: integer
 *         refereeId:
 *           type: integer
 *         role:
 *           type: string
 *           enum: [main, assistant]
 *         isAvailable:
 *           type: boolean
 *           default: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     KnockoutBracket:
 *       type: object
 *       required:
 *         - categoryId
 *         - roundNumber
 *         - bracketPosition
 *       properties:
 *         id:
 *           type: integer
 *         categoryId:
 *           type: integer
 *         roundNumber:
 *           type: integer
 *         bracketPosition:
 *           type: integer
 *         scheduleId:
 *           type: integer
 *         matchId:
 *           type: integer
 *         entryAId:
 *           type: integer
 *         entryBId:
 *           type: integer
 *         winnerEntryId:
 *           type: integer
 *         nextBracketId:
 *           type: integer
 *         previousBracketAId:
 *           type: integer
 *         previousBracketBId:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [pending, ready, in_progress, completed]
 *           default: pending
 *         roundName:
 *           type: string
 *           maxLength: 50
 *         isByeMatch:
 *           type: boolean
 *           default: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     PendingMatchResult:
 *       type: object
 *       required:
 *         - id
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
 *         resultStatus:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         winnerEntryId:
 *           type: integer
 *         reviewNotes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Notification:
 *       type: object
 *       required:
 *         - type
 *         - title
 *         - message
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         recipientCount:
 *           type: integer
 *         timestamp:
 *           type: string
 *           format: date-time
 *
 *     Schedule:
 *       type: object
 *       required:
 *         - categoryId
 *         - scheduledAt
 *       properties:
 *         id:
 *           type: integer
 *         categoryId:
 *           type: integer
 *         roundNumber:
 *           type: integer
 *         groupName:
 *           type: string
 *           maxLength: 50
 *         stage:
 *           type: string
 *           enum: [group, knockout]
 *         knockoutRound:
 *           type: string
 *           maxLength: 50
 *         tableNumber:
 *           type: integer
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
 *         resultStatus:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           description: Match result approval status
 *         reviewNotes:
 *           type: string
 *           description: Review notes from chief referee
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
 *         - subMatchId
 *         - setNumber
 *       properties:
 *         id:
 *           type: integer
 *         subMatchId:
 *           type: integer
 *         matchId:
 *           type: integer
 *           deprecated: true
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
 * tags:
 *   - name: Users
 *     description: User management 
 *   - name: Tournaments
 *     description: Tournament management
 *   - name: Matches
 *     description: Match management
 *   - name: ELO Scores
 *     description: ELO scoring system
 */

