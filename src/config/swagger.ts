import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "SmashHub API",
    version: "1.0.0",
    description:
      "API documentation for SmashHub - Tournament Management System",
    contact: {
      name: "SmashHub Team",
      email: "smashhub.app@gmail.com",
    },
  },
  servers: [
    {
      url: "https://api.smashhub.io.vn/api",
      description: "Production server",
    },
    {
      url: "http://localhost:3000/api",
      description: "Development server",
    },
  ],
  tags: [
    { name: "Auth", description: "Authentication and authorization endpoints" },
    { name: "Users", description: "User management endpoints" },
    { name: "Roles", description: "Role management endpoints" },
    { name: "Permissions", description: "Permission management endpoints" },
    { name: "Role Permissions", description: "Role permission assignment endpoints" },
    { name: "User Roles", description: "User role assignment endpoints" },
    { name: "Tournaments", description: "Tournament management endpoints" },
    {
      name: "Tournament Categories",
      description: "Tournament category endpoints",
    },
    { name: "Tournament Referees", description: "Tournament referee management endpoints" },
    { name: "Entries", description: "Entry management endpoints" },
    { name: "Schedules", description: "Schedule management endpoints" },
    { name: "Schedule Config", description: "Schedule configuration endpoints" },
    { name: "Matches", description: "Match management endpoints" },
    { name: "Match Sets", description: "Match set endpoints" },
    { name: "Sub Matches", description: "Sub-match management endpoints" },
    { name: "Sub Match Players", description: "Sub-match player assignment endpoints" },
    { name: "Group Standings", description: "Group stage standing management endpoints" },
    { name: "Knockout Brackets", description: "Knockout bracket management endpoints" },
    { name: "ELO Calculation", description: "ELO calculation and updates endpoints" },
    { name: "ELO Scores", description: "ELO scoring system endpoints" },
    { name: "ELO Histories", description: "ELO history tracking endpoints" },
    { name: "Payments", description: "Payment and entry fee management endpoints" },
    { name: "Notifications", description: "Real-time notifications endpoints" },
    { name: "Admin System", description: "Admin system health and realtime operations endpoints" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter JWT token (without 'Bearer' prefix)",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "Error message",
          },
        },
      },
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: { type: "object", nullable: true },
        },
      },
      PaginationParams: {
        type: "object",
        properties: {
          page: {
            type: "integer",
            default: 1,
            description: "Page number for pagination",
          },
          limit: {
            type: "integer",
            default: 10,
            description: "Maximum number of records to return",
          },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          total: { type: "integer", description: "Total number of records" },
          page: { type: "integer", description: "Current page number" },
          limit: { type: "integer", description: "Records per page" },
          totalPages: { type: "integer", description: "Total number of pages" },
          hasNextPage: { type: "boolean", description: "Whether a next page exists" },
          hasPrevPage: { type: "boolean", description: "Whether a previous page exists" },
        },
      },
      UserSummary: {
        type: "object",
        properties: {
          id: { type: "integer" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string", format: "email" },
        },
      },
      User: {
        type: "object",
        required: ["firstName", "lastName", "email"],
        properties: {
          id: { type: "integer" },
          firstName: { type: "string", maxLength: 50 },
          lastName: { type: "string", maxLength: 50 },
          email: { type: "string", maxLength: 100 },
          isEmailVerified: { type: "boolean", default: false },
          gender: { type: "string", enum: ["male", "female"] },
          avatarUrl: { type: "string", maxLength: 255 },
          dob: { type: "string", format: "date" },
          phoneNumber: { type: "string", maxLength: 20 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      UserDetail: {
        type: "object",
        properties: {
          id: { type: "integer" },
          firstName: { type: "string", maxLength: 50 },
          lastName: { type: "string", maxLength: 50 },
          email: { type: "string", maxLength: 100 },
          isEmailVerified: { type: "boolean" },
          gender: { type: "string", enum: ["male", "female"] },
          avatarUrl: { type: "string", maxLength: 255 },
          dob: { type: "string", format: "date" },
          phoneNumber: { type: "string", maxLength: 20 },
          roles: {
            type: "array",
            items: { $ref: "#/components/schemas/Role" },
          },
          eloScore: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/EloScore" }],
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PublicUser: {
        type: "object",
        description: "Public user profile. Sensitive fields are omitted.",
        properties: {
          id: { type: "integer" },
          firstName: { type: "string", maxLength: 50 },
          lastName: { type: "string", maxLength: 50 },
          gender: { type: "string", enum: ["male", "female"], nullable: true },
          avatarUrl: { type: "string", maxLength: 255, nullable: true },
          dob: { type: "string", format: "date", nullable: true },
          eloScore: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/EloScore" }],
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AccessToken: {
        type: "object",
        required: ["userId", "token", "expiresAt"],
        properties: {
          id: { type: "integer", description: "Token ID" },
          userId: { type: "integer", description: "User ID associated with this token" },
          token: { type: "string", description: "JWT access token" },
          expiresAt: { type: "string", format: "date-time", description: "Token expiration time" },
          isBlacklisted: { type: "boolean", default: false, description: "Whether the token is blacklisted" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RefreshToken: {
        type: "object",
        required: ["userId", "token", "expiresAt"],
        properties: {
          id: { type: "integer", description: "Token ID" },
          userId: { type: "integer", description: "User ID associated with this token" },
          token: { type: "string", description: "JWT refresh token" },
          expiresAt: { type: "string", format: "date-time", description: "Token expiration time" },
          isBlacklisted: { type: "boolean", default: false, description: "Whether the token is blacklisted" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Otp: {
        type: "object",
        required: ["userId", "code", "type", "expiresAt"],
        properties: {
          id: { type: "integer", description: "OTP ID" },
          userId: { type: "integer", description: "User ID associated with this OTP" },
          code: { type: "string", maxLength: 6, description: "6-digit OTP code" },
          type: { 
            type: "string", 
            enum: ["password_reset", "email_verification"],
            description: "Type of OTP" 
          },
          expiresAt: { type: "string", format: "date-time", description: "OTP expiration time" },
          isUsed: { type: "boolean", default: false, description: "Whether the OTP has been used" },
          usedAt: { type: "string", format: "date-time", description: "When the OTP was used" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Role: {
        type: "object",
        required: ["name"],
        properties: {
          id: { type: "integer" },
          name: { type: "string", maxLength: 50 },
          description: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RolePermission: {
        type: "object",
        required: ["roleId", "permissionId"],
        properties: {
          roleId: { type: "integer" },
          permissionId: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Permission: {
        type: "object",
        required: ["name"],
        properties: {
          id: { type: "integer" },
          name: { type: "string", maxLength: 100 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Tournament: {
        type: "object",
        required: ["name", "tier", "location", "createdBy"],
        properties: {
          id: { type: "integer" },
          name: { type: "string", maxLength: 255 },
          introduction: {
            type: "string",
            nullable: true,
            description: "Tournament introduction",
          },
          tier: { type: "integer", minimum: 1, maximum: 5 },
          status: {
            type: "string",
            enum: ["upcoming", "registration_open", "registration_closed", "brackets_generated", "ongoing", "completed", "cancelled"],
            default: "upcoming",
          },
          location: { type: "string", maxLength: 100 },
          createdBy: { type: "integer" },
          categories: {
            type: "array",
            items: { $ref: "#/components/schemas/TournamentCategory" },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      TournamentDetail: {
        allOf: [
          { $ref: "#/components/schemas/Tournament" },
          {
            type: "object",
            properties: {
              scheduleConfig: {
                nullable: true,
                allOf: [{ $ref: "#/components/schemas/ScheduleConfig" }],
              },
              creator: {
                nullable: true,
                allOf: [{ $ref: "#/components/schemas/PublicUser" }],
              },
            },
          },
        ],
      },
      CreateTournamentRequest: {
        type: "object",
        required: ["name", "tier", "location"],
        properties: {
          name: { type: "string", minLength: 3, maxLength: 255 },
          introduction: {
            type: "string",
            nullable: true,
            description: "Tournament introduction",
          },
          tier: { type: "integer", minimum: 1, maximum: 5 },
          location: { type: "string", maxLength: 100 },
          status: {
            type: "string",
            enum: ["upcoming", "registration_open", "registration_closed", "brackets_generated", "ongoing", "completed", "cancelled"],
            default: "upcoming",
          },
          categories: {
            type: "array",
            items: { $ref: "#/components/schemas/CreateTournamentCategoryRequest" },
          },
        },
      },
      UpdateTournamentRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 3, maxLength: 255 },
          introduction: {
            type: "string",
            nullable: true,
            description: "Tournament introduction",
          },
          tier: { type: "integer", minimum: 1, maximum: 5 },
          location: { type: "string", maxLength: 100 },
          status: {
            type: "string",
            enum: ["upcoming", "registration_open", "registration_closed", "brackets_generated", "ongoing", "completed", "cancelled"],
          },
          categories: {
            type: "array",
            description: "If provided, replaces all existing categories.",
            items: { $ref: "#/components/schemas/CreateTournamentCategoryRequest" },
          },
        },
      },
      CreateTournamentCategoryRequest: {
        type: "object",
        required: ["name", "type", "maxEntries", "maxSets"],
        properties: {
          name: { type: "string", maxLength: 100 },
          type: { type: "string", enum: ["single", "double", "team"] },
          maxEntries: { type: "integer" },
          maxSets: { type: "integer", enum: [5, 7] },
          teamFormat: {
            type: "string",
            nullable: true,
            maxLength: 50,
            description: "Required for team categories, e.g. S-S-S or S-D-S.",
          },
          minAge: { type: "integer", nullable: true, minimum: 0 },
          maxAge: { type: "integer", nullable: true, minimum: 0 },
          minElo: { type: "integer", nullable: true, minimum: 0 },
          maxElo: { type: "integer", nullable: true, minimum: 0 },
          maxMembersPerEntry: {
            type: "integer",
            nullable: true,
            minimum: 3,
            description: "Only applicable for team categories. Null means no upper limit.",
          },
          gender: { type: "string", nullable: true, enum: ["male", "female", "mixed"] },
          isGroupStage: { type: "boolean", default: false },
        },
      },
      TournamentCategory: {
        type: "object",
        required: ["tournamentId", "name", "type", "maxEntries", "maxSets"],
        properties: {
          id: { type: "integer" },
          tournamentId: { type: "integer" },
          name: { type: "string", maxLength: 100 },
          type: {
            type: "string",
            enum: ["single", "team", "double"],
          },
          maxEntries: { type: "integer" },
          maxSets: { type: "integer" },
          teamFormat: { type: "string", nullable: true, maxLength: 50 },
          minAge: { type: "integer" },
          maxAge: { type: "integer" },
          minElo: { type: "integer" },
          maxElo: { type: "integer" },
          maxMembersPerEntry: {
            type: "integer",
            nullable: true,
            description: "Only applicable for team categories. Null means no upper limit.",
          },
          gender: { type: "string", enum: ["male", "female", "mixed"] },
          isGroupStage: { type: "boolean" },
          entryFee: {
            type: "number",
            format: "decimal",
            nullable: true,
            default: 0,
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Entry: {
        type: "object",
        required: ["categoryId", "name"],
        properties: {
          id: { type: "integer" },
          categoryId: { type: "integer" },
          captainId: { type: "integer", nullable: true },
          name: { type: "string", maxLength: 100 },
          isAcceptingMembers: { type: "boolean", default: false },
          requiredMemberCount: {
            type: "integer",
            nullable: true,
            minimum: 1,
            maximum: 100,
          },
          currentMemberCount: { type: "integer", minimum: 0, default: 0 },
          isConfirmed: { type: "boolean", default: false },
          confirmedAt: { type: "string", format: "date-time", nullable: true },
          category: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/TournamentCategory" }],
          },
          captain: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/UserDetail" }],
          },
          members: {
            type: "array",
            items: { $ref: "#/components/schemas/EntryMember" },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      EntryDetail: {
        allOf: [
          { $ref: "#/components/schemas/Entry" },
          {
            type: "object",
            properties: {
              category: {
                nullable: true,
                allOf: [{ $ref: "#/components/schemas/TournamentCategory" }],
              },
              captain: {
                nullable: true,
                allOf: [{ $ref: "#/components/schemas/PublicUser" }],
              },
              members: {
                type: "array",
                items: { $ref: "#/components/schemas/PublicEntryMember" },
              },
            },
          },
        ],
      },
      Schedule: {
        type: "object",
        required: ["categoryId", "scheduledAt"],
        properties: {
          id: { type: "integer" },
          categoryId: { type: "integer" },
          roundNumber: { type: "integer" },
          groupName: { type: "string", maxLength: 50 },
          stage: { type: "string", enum: ["group", "knockout"], default: "group" },
          knockoutRound: { type: "string", maxLength: 50 },
          tableNumber: { type: "integer" },
          scheduledAt: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ScheduleConfig: {
        type: "object",
        required: ["tournamentId", "startDate", "endDate", "registrationStartDate", "registrationEndDate", "bracketGenerationDate"],
        properties: {
          id: { type: "integer" },
          tournamentId: { type: "integer", description: "Tournament ID" },
          startDate: { type: "string", format: "date-time", description: "Tournament start date and time. Must be ISO 8601 UTC ending with Z, e.g. 2026-10-12T01:00:00.000Z" },
          endDate: { type: "string", format: "date-time", description: "Tournament end date and time. Must be ISO 8601 UTC ending with Z" },
          registrationStartDate: { type: "string", format: "date-time", description: "Registration start date and time. Must be ISO 8601 UTC ending with Z" },
          registrationEndDate: { type: "string", format: "date-time", description: "Registration end date and time. Must be ISO 8601 UTC ending with Z" },
          bracketGenerationDate: { type: "string", format: "date-time", description: "Bracket generation date and time. Must be ISO 8601 UTC ending with Z" },
          numberOfTables: { type: "integer", minimum: 1, default: 1, description: "Number of tables available for parallel matches" },
          matchDurationMinutes: { type: "integer", minimum: 30, maximum: 90, default: 30, description: "Duration of each match in minutes" },
          breakDurationMinutes: { type: "integer", minimum: 5, maximum: 30, default: 10, description: "Break time between matches in minutes" },
          dailyStartHour: { type: "integer", minimum: 0, maximum: 23, default: 8, description: "Daily start hour (0-23)" },
          dailyStartMinute: { type: "integer", minimum: 0, maximum: 59, default: 0, description: "Daily start minute (0-59)" },
          dailyEndHour: { type: "integer", minimum: 0, maximum: 23, default: 22, description: "Daily end hour (0-23)" },
          dailyEndMinute: { type: "integer", minimum: 0, maximum: 59, default: 0, description: "Daily end minute (0-59)" },
          lunchBreakStartHour: { type: "integer", nullable: true, minimum: 0, maximum: 23, description: "Lunch break start hour (optional)" },
          lunchBreakStartMinute: { type: "integer", nullable: true, minimum: 0, maximum: 59, default: 0, description: "Lunch break start minute (optional)" },
          lunchBreakEndHour: { type: "integer", nullable: true, minimum: 0, maximum: 23, description: "Lunch break end hour (optional)" },
          lunchBreakEndMinute: { type: "integer", nullable: true, minimum: 0, maximum: 59, default: 0, description: "Lunch break end minute (optional)" },
          lunchBreakDurationMinutes: { type: "integer", nullable: true, minimum: 1, description: "Optional; must equal lunchBreakEnd - lunchBreakStart in minutes when provided" },
          timeZone: { type: "string", readOnly: true, example: "UTC", description: "Canonical backend timezone" },
          notes: { type: "string", nullable: true, description: "Additional notes about the configuration" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ScheduleValidationResponse: {
        type: "object",
        required: ["isValid", "message", "details"],
        properties: {
          isValid: { type: "boolean", description: "Whether the config fits within tournament timeframe" },
          message: { type: "string", description: "Validation result message" },
          details: {
            type: "object",
            required: ["totalMatches", "totalSlots", "estimatedEndTime", "tournamentEndTime"],
            properties: {
              totalMatches: { type: "integer", description: "Number of matches to schedule" },
              totalSlots: { type: "integer", description: "Number of time slots needed" },
              estimatedEndTime: { type: "string", format: "date-time", description: "When the schedule is expected to finish" },
              tournamentEndTime: { type: "string", format: "date-time", description: "Tournament end time" },
              overflowMinutes: { type: "integer", description: "How many minutes over the limit (if not valid)" },
            },
          },
        },
      },
      Match: {
        type: "object",
        required: ["scheduleId", "entryAId", "entryBId", "status"],
        properties: {
          id: { type: "integer" },
          scheduleId: { type: "integer" },
          entryAId: { type: "integer" },
          entryBId: { type: "integer" },
          status: {
            type: "string",
            enum: ["scheduled", "in_progress", "completed", "cancelled"],
            default: "scheduled",
          },
          winnerEntryId: { type: "integer", nullable: true },
          resultStatus: {
            type: "string",
            enum: ["pending", "approved"],
            nullable: true,
          },
          reviewNotes: { type: "string", nullable: true, maxLength: 1000 },
          schedule: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/Schedule" }],
          },
          entryA: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/Entry" }],
          },
          entryB: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/Entry" }],
          },
          winnerEntry: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/Entry" }],
          },
          subMatches: {
            type: "array",
            items: { $ref: "#/components/schemas/SubMatch" },
          },
          matchReferees: {
            type: "array",
            items: { $ref: "#/components/schemas/MatchReferee" },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MatchSet: {
        type: "object",
        required: ["subMatchId", "setNumber"],
        properties: {
          id: { type: "integer" },
          subMatchId: { type: "integer" },
          setNumber: { type: "integer", minimum: 1, maximum: 7 },
          entryAScore: { type: "integer", minimum: 0, maximum: 30, default: 0 },
          entryBScore: { type: "integer", minimum: 0, maximum: 30, default: 0 },
          subMatch: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/SubMatch" }],
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MatchReferee: {
        type: "object",
        required: ["matchId", "refereeId"],
        properties: {
          id: { type: "integer" },
          matchId: { type: "integer" },
          refereeId: { type: "integer" },
          referee: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/UserDetail" }],
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      EloScore: {
        type: "object",
        required: ["userId"],
        properties: {
          id: { type: "integer" },
          userId: { type: "integer" },
          score: { type: "integer", default: 1000 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      EloHistory: {
        type: "object",
        required: [
          "matchId",
          "userId",
          "previousElo",
          "newElo",
          "eloDelta",
          "changeReason",
        ],
        properties: {
          id: { type: "integer" },
          matchId: { type: "integer" },
          userId: { type: "integer" },
          previousElo: { type: "integer" },
          newElo: { type: "integer" },
          eloDelta: { type: "integer" },
          tournamentId: { type: "integer", nullable: true },
          changeReason: { type: "string", maxLength: 255 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      EntryMember: {
        type: "object",
        required: ["entryId", "userId", "eloAtEntry"],
        properties: {
          id: { type: "integer" },
          entryId: { type: "integer" },
          userId: { type: "integer" },
          eloAtEntry: { type: "integer", minimum: 0, maximum: 10000 },
          entry: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/Entry" }],
          },
          user: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/UserDetail" }],
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PublicEntryMember: {
        type: "object",
        properties: {
          id: { type: "integer" },
          entryId: { type: "integer" },
          userId: { type: "integer" },
          eloAtEntry: { type: "integer", minimum: 0, maximum: 10000 },
          user: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/PublicUser" }],
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      JoinRequest: {
        type: "object",
        required: ["entryId", "userId", "status", "type"],
        properties: {
          id: { type: "integer" },
          type: {
            type: "string",
            enum: ["requested", "invited"],
            default: "requested",
          },
          entryId: { type: "integer" },
          userId: { type: "integer" },
          status: {
            type: "string",
            enum: ["pending", "approved", "rejected"],
            default: "pending",
          },
          rejectionReason: { type: "string", maxLength: 255, nullable: true },
          respondedAt: { type: "string", format: "date-time", nullable: true },
          entry: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/Entry" }],
          },
          user: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/UserDetail" }],
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      GroupStanding: {
        type: "object",
        required: ["categoryId", "groupName", "entryId"],
        properties: {
          id: { type: "integer" },
          categoryId: { type: "integer" },
          groupName: { type: "string", maxLength: 50 },
          entryId: { type: "integer" },
          matchesPlayed: { type: "integer", minimum: 0, default: 0 },
          matchesWon: { type: "integer", minimum: 0, default: 0 },
          matchesLost: { type: "integer", minimum: 0, default: 0 },
          setsWon: { type: "integer", minimum: 0, default: 0 },
          setsLost: { type: "integer", minimum: 0, default: 0 },
          setsDiff: {
            type: "integer",
            default: 0,
            description: "setsWon - setsLost",
          },
          position: { type: "integer", nullable: true, minimum: 1 },
          entry: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/Entry" }],
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      TournamentReferee: {
        type: "object",
        required: ["tournamentId", "refereeId", "role"],
        properties: {
          id: { type: "integer", description: "Unique identifier" },
          tournamentId: { type: "integer", description: "Tournament ID" },
          refereeId: { type: "integer", description: "User ID of the referee" },
          role: {
            type: "string",
            enum: ["referee", "chief"],
            description: "Referee role in the tournament"
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      TournamentRefereeWithUser: {
        allOf: [
          { $ref: "#/components/schemas/TournamentReferee" },
          {
            type: "object",
            properties: {
              referee: {
                nullable: true,
                allOf: [{ $ref: "#/components/schemas/UserSummary" }],
              },
            },
          },
        ],
      },
      TournamentRefereesResponse: {
        type: "object",
        required: ["referees", "pagination"],
        properties: {
          referees: {
            type: "array",
            items: { $ref: "#/components/schemas/TournamentRefereeWithUser" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
      },
      RefereeInvitation: {
        type: "object",
        required: ["tournamentId", "refereeId", "invitedBy", "role", "status", "expiresAt"],
        properties: {
          id: { type: "integer", description: "Unique identifier" },
          tournamentId: { type: "integer", description: "Tournament ID" },
          refereeId: {
            type: "integer",
            description: "User ID of the invited referee"
          },
          invitedBy: {
            type: "integer",
            description: "User ID of the organizer who sent the invitation"
          },
          role: {
            type: "string",
            enum: ["referee", "chief"],
            description: "Role the referee is invited for"
          },
          status: {
            type: "string",
            enum: ["pending", "accepted", "rejected", "cancelled", "expired"],
            description: "Current status of the invitation"
          },
          expiresAt: {
            type: "string",
            format: "date-time",
            description: "When the invitation expires (default 48 hours from creation)"
          },
          respondedAt: {
            type: "string",
            format: "date-time",
            nullable: true,
            description: "When the referee responded or organizer cancelled/expired"
          },
          rejectionReason: {
            type: "string",
            maxLength: 255,
            nullable: true,
            description: "Reason for rejection (if status is rejected)"
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      RefereeInvitationWithReferee: {
        allOf: [
          { $ref: "#/components/schemas/RefereeInvitation" },
          {
            type: "object",
            properties: {
              referee: {
                nullable: true,
                allOf: [{ $ref: "#/components/schemas/UserSummary" }],
              },
            },
          },
        ],
      },
      RefereeInvitationWithDetails: {
        allOf: [
          { $ref: "#/components/schemas/RefereeInvitation" },
          {
            type: "object",
            properties: {
              tournament: {
                nullable: true,
                allOf: [
                  { $ref: "#/components/schemas/Tournament" },
                  {
                    type: "object",
                    properties: {
                      scheduleConfig: {
                        nullable: true,
                        allOf: [{ $ref: "#/components/schemas/ScheduleConfig" }],
                      },
                    },
                  },
                ],
              },
              inviter: {
                nullable: true,
                allOf: [{ $ref: "#/components/schemas/UserSummary" }],
              },
            },
          },
        ],
      },
      RefereeInvitationsResponse: {
        type: "object",
        required: ["invitations", "pagination"],
        properties: {
          invitations: {
            type: "array",
            items: { $ref: "#/components/schemas/RefereeInvitationWithReferee" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
      },
      MyRefereeInvitationsResponse: {
        type: "object",
        required: ["invitations", "pagination"],
        properties: {
          invitations: {
            type: "array",
            items: { $ref: "#/components/schemas/RefereeInvitationWithDetails" },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
      },
      KnockoutBracket: {
        type: "object",
        required: ["categoryId", "roundNumber", "bracketPosition", "roundName"],
        properties: {
          id: { type: "integer" },
          categoryId: { type: "integer" },
          roundNumber: { type: "integer", minimum: 1, maximum: 6 },
          bracketPosition: { type: "integer", minimum: 0 },
          roundName: {
            type: "string",
            enum: ["Round of 64", "Round of 32", "Round of 16", "Quarter-final", "Semi-final", "Final"],
          },
          scheduleId: { type: "integer", nullable: true },
          matchId: { type: "integer", nullable: true },
          entryAId: { type: "integer", nullable: true },
          entryBId: { type: "integer", nullable: true },
          winnerEntryId: { type: "integer", nullable: true },
          nextBracketId: { type: "integer", nullable: true },
          previousBracketAId: { type: "integer", nullable: true },
          previousBracketBId: { type: "integer", nullable: true },
          status: {
            type: "string",
            enum: ["pending", "ready", "in_progress", "completed"],
            default: "pending",
          },
          isByeMatch: { type: "boolean", default: false },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      BracketSlotDto: {
        type: "object",
        required: ["entryId", "entryName"],
        properties: {
          entryId: { type: "integer", nullable: true },
          entryName: { type: "string", example: "TBD" },
        },
      },
      BracketDto: {
        type: "object",
        required: [
          "id",
          "roundNumber",
          "roundName",
          "bracketPosition",
          "entryA",
          "entryB",
          "winnerEntryId",
          "status",
          "isByeMatch",
          "previousBracketAId",
          "previousBracketBId",
          "nextBracketId",
        ],
        properties: {
          id: { type: "integer" },
          roundNumber: { type: "integer", minimum: 1, maximum: 6 },
          roundName: {
            type: "string",
            enum: ["Round of 64", "Round of 32", "Round of 16", "Quarter-final", "Semi-final", "Final"],
          },
          bracketPosition: { type: "integer", minimum: 0 },
          entryA: { $ref: "#/components/schemas/BracketSlotDto" },
          entryB: { $ref: "#/components/schemas/BracketSlotDto" },
          winnerEntryId: { type: "integer", nullable: true },
          status: {
            type: "string",
            enum: ["pending", "ready", "in_progress", "completed"],
          },
          isByeMatch: { type: "boolean" },
          previousBracketAId: { type: "integer", nullable: true },
          previousBracketBId: { type: "integer", nullable: true },
          nextBracketId: { type: "integer", nullable: true },
        },
      },
      RoundDto: {
        type: "object",
        required: ["roundNumber", "roundName", "brackets"],
        properties: {
          roundNumber: { type: "integer", minimum: 1, maximum: 6 },
          roundName: {
            type: "string",
            enum: ["Round of 64", "Round of 32", "Round of 16", "Quarter-final", "Semi-final", "Final"],
          },
          brackets: {
            type: "array",
            items: { $ref: "#/components/schemas/BracketDto" },
          },
        },
      },
      BracketTreeDto: {
        type: "object",
        required: ["categoryId", "totalRounds", "totalBrackets", "rounds"],
        properties: {
          categoryId: { type: "integer" },
          totalRounds: { type: "integer" },
          totalBrackets: { type: "integer" },
          rounds: {
            type: "array",
            items: { $ref: "#/components/schemas/RoundDto" },
          },
        },
      },
      SubMatch: {
        type: "object",
        required: ["matchId", "subMatchNumber", "status"],
        properties: {
          id: { type: "integer", description: "Unique identifier" },
          matchId: { type: "integer", description: "Parent match ID" },
          subMatchNumber: { type: "integer", minimum: 1, maximum: 10 },
          status: {
            type: "string",
            enum: ["scheduled", "in_progress", "completed"],
            default: "scheduled",
            description: "Current status of the sub-match"
          },
          winnerTeam: {
            type: "string",
            enum: ["A", "B"],
            nullable: true,
            description: "Winning team (A or B)"
          },
          umpireId: {
            type: "integer",
            nullable: true,
            description: "Referee ID assigned as umpire"
          },
          assistantUmpireId: {
            type: "integer",
            nullable: true,
            description: "Optional assistant umpire ID"
          },
          matchSets: {
            type: "array",
            items: { $ref: "#/components/schemas/MatchSet" },
          },
          subMatchPlayers: {
            type: "array",
            items: { $ref: "#/components/schemas/SubMatchPlayer" },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      SubMatchPlayer: {
        type: "object",
        required: ["subMatchId", "entryMemberId", "team"],
        properties: {
          id: { type: "integer", description: "Unique identifier" },
          subMatchId: { type: "integer", description: "Sub-match ID" },
          entryMemberId: { type: "integer", description: "Entry member ID (player)" },
          team: {
            type: "string",
            enum: ["A", "B"],
            description: "Team assignment"
          },
          entryMember: {
            nullable: true,
            allOf: [{ $ref: "#/components/schemas/EntryMember" }],
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ScheduleResponse: {
        type: "object",
        properties: {
          id: { type: "integer" },
          categoryId: { type: "integer" },
          roundNumber: { type: "integer" },
          groupName: { type: "string", maxLength: 50 },
          stage: { type: "string", enum: ["group", "knockout"] },
          knockoutRound: { type: "string", maxLength: 50 },
          tableNumber: { type: "integer" },
          scheduledAt: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PendingMatchResult: {
        type: "object",
        required: ["id", "scheduleId", "entryAId", "entryBId", "status"],
        properties: {
          id: { type: "integer" },
          scheduleId: { type: "integer" },
          entryAId: { type: "integer" },
          entryBId: { type: "integer" },
          status: {
            type: "string",
            enum: ["scheduled", "in_progress", "completed", "cancelled"],
          },
          resultStatus: {
            type: "string",
            enum: ["pending", "approved"],
          },
          winnerEntryId: { type: "integer" },
          reviewNotes: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Notification: {
        type: "object",
        required: ["type", "title", "message"],
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          recipientCount: { type: "integer" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
      SchedulePreviewResponse: {
        type: "object",
        required: ["isValid", "message", "preview"],
        properties: {
          isValid: { type: "boolean", description: "Whether the schedule is valid" },
          message: { type: "string", description: "Validation message" },
          requiresRegeneration: { type: "boolean", description: "Whether existing schedules must be regenerated" },
          regenerationKey: { type: "string", description: "Confirmation key required for schedule regeneration", nullable: true },
          affectedScheduleCount: { type: "integer", description: "Number of existing schedules affected by the update", nullable: true },
          preview: {
            type: "object",
            properties: {
              totalMatches: { type: "integer", description: "Total number of matches" },
              totalSlots: { type: "integer", description: "Total available time slots" },
              estimatedEndTime: { type: "string", format: "date-time", description: "Estimated end time of tournament" },
              tournamentEndTime: { type: "string", format: "date-time", description: "Configured tournament end time" },
              availableMinutes: { type: "integer", description: "Available minutes in schedule" },
              neededMinutes: { type: "integer", description: "Minutes needed for all matches" },
              overflowMinutes: { type: "integer", description: "Overflow minutes if any", nullable: true },
              startDate: { type: "string", format: "date-time" },
              endDate: { type: "string", format: "date-time" },
              registrationStartDate: { type: "string", format: "date-time" },
              registrationEndDate: { type: "string", format: "date-time" },
              bracketGenerationDate: { type: "string", format: "date-time" },
              numberOfTables: { type: "integer" },
              matchDurationMinutes: { type: "integer" },
              breakDurationMinutes: { type: "integer" },
            },
          },
        },
      },
    },
    parameters: {
      pageParam: {
        in: "query",
        name: "page",
        schema: {
          type: "integer",
          default: 1,
        },
        description: "Page number for pagination",
      },
      limitParam: {
        in: "query",
        name: "limit",
        schema: {
          type: "integer",
          default: 10,
        },
        description: "Maximum number of records to return",
      },
      idParam: {
        in: "path",
        name: "id",
        required: true,
        schema: {
          type: "integer",
        },
        description: "Resource ID",
      },
    },
    responses: {
      Success200: {
        description: "Request processed successfully",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SuccessResponse" },
          },
        },
      },
      Created201: {
        description: "Resource created successfully",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/SuccessResponse" },
          },
        },
      },
      NoContent204: {
        description: "Request processed successfully, no content returned",
      },
      BadRequest400: {
        description: "Invalid request data",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { message: "Invalid request data" },
          },
        },
      },
      Unauthorized401: {
        description: "Authentication required or token invalid",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { message: "Unauthorized access" },
          },
        },
      },
      Forbidden403: {
        description: "Insufficient permissions",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { message: "Forbidden - insufficient permissions" },
          },
        },
      },
      NotFound404: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { message: "Resource not found" },
          },
        },
      },
      Conflict409: {
        description: "Conflict - resource already exists or state conflict",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { message: "Resource already exists" },
          },
        },
      },
      InternalError500: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { message: "Internal server error" },
          },
        },
      },
      // Legacy responses - deprecated
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { message: "Resource not found" },
          },
        },
      },
      BadRequest: {
        description: "Bad request",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { message: "Invalid request data" },
          },
        },
      },
      InternalError: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { message: "Internal server error" },
          },
        },
      },
      NoContent: {
        description: "Successfully deleted, no content returned",
      },
    },
      InternalServerError: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { message: "Internal server error" },
          },
        },
      },
  },
};

const options = {
  swaggerDefinition,
  apis: [
    path.resolve(__dirname, "../routes/*.{ts,js}"),
    path.resolve(__dirname, "../controllers/*.{ts,js}"),
    path.resolve(__dirname, "../dto/*.{ts,js}"),
    path.resolve(__dirname, "../docs/*.{ts,js}"),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
