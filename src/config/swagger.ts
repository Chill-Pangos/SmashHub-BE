import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "SmashHub API",
    version: "1.0.0",
    description:
      "API documentation for SmashHub - Tournament Management System",
    contact: {
      name: "SmashHub Team",
      email: "support@smashhub.com",
    },
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Development server",
    },
    {
      url: "https://api.smashhub.com/api",
      description: "Production server",
    },
  ],
  tags: [
    { name: "Users", description: "User management endpoints" },
    { name: "Roles", description: "Role management endpoints" },
    { name: "Permissions", description: "Permission management endpoints" },
    { name: "Tournaments", description: "Tournament management endpoints" },
    {
      name: "Tournament Categories",
      description: "Tournament category endpoints",
    },
    { name: "Entries", description: "Entry management endpoints" },
    { name: "Schedules", description: "Schedule management endpoints" },
    { name: "Schedule Config", description: "Schedule configuration endpoints" },
    { name: "Matches", description: "Match management endpoints" },
    { name: "Match Sets", description: "Match set endpoints" },
    { name: "ELO Scores", description: "ELO scoring system endpoints" },
    { name: "ELO Histories", description: "ELO history tracking endpoints" },
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
      PaginationParams: {
        type: "object",
        properties: {
          skip: {
            type: "integer",
            default: 0,
            description: "Number of records to skip",
          },
          limit: {
            type: "integer",
            default: 10,
            description: "Maximum number of records to return",
          },
        },
      },
      User: {
        type: "object",
        required: ["firstName", "lastName", "email", "password"],
        properties: {
          id: { type: "integer" },
          firstName: { type: "string", maxLength: 50 },
          lastName: { type: "string", maxLength: 50 },
          email: { type: "string", maxLength: 100 },
          password: { type: "string", maxLength: 255 },
          isEmailVerified: { type: "boolean", default: false },
          gender: { type: "string", enum: ["male", "female", "other"] },
          avatarUrl: { type: "string", maxLength: 255 },
          dob: { type: "string", format: "date" },
          phoneNumber: { type: "string", maxLength: 20 },
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
        required: ["name", "tier", "startDate", "endDate", "registrationStartDate", "registrationEndDate", "bracketGenerationDate", "location", "createdBy"],
        properties: {
          id: { type: "integer" },
          name: { type: "string", maxLength: 255 },
          tier: { type: "integer", minimum: 1, maximum: 5 },
          status: {
            type: "string",
            enum: ["upcoming", "registration_open", "registration_closed", "brackets_generated", "ongoing", "completed", "cancelled"],
            default: "upcoming",
          },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          registrationStartDate: { type: "string", format: "date-time" },
          registrationEndDate: { type: "string", format: "date-time" },
          bracketGenerationDate: { type: "string", format: "date-time" },
          location: { type: "string", maxLength: 100 },
          numberOfTables: { type: "integer", default: 1 },
          createdBy: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
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
          numberOfSingles: { type: "integer" },
          numberOfDoubles: { type: "integer" },
          minAge: { type: "integer" },
          maxAge: { type: "integer" },
          minElo: { type: "integer" },
          maxElo: { type: "integer" },
          gender: { type: "string", enum: ["male", "female", "mixed"] },
          isGroupStage: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Entry: {
        type: "object",
        required: ["categoryId"],
        properties: {
          id: { type: "integer" },
          categoryId: { type: "integer" },
          captainId: { type: "integer" },
          isAcceptingMembers: { type: "boolean" },
          requiredMemberCount: { type: "integer" },
          currentMemberCount: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
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
        required: ["tournamentId"],
        properties: {
          id: { type: "integer" },
          tournamentId: { type: "integer", description: "Tournament ID" },
          matchDurationMinutes: { type: "integer", minimum: 15, maximum: 120, default: 60, description: "Duration of each match in minutes" },
          breakDurationMinutes: { type: "integer", minimum: 0, maximum: 60, default: 10, description: "Break time between matches in minutes" },
          dailyStartHour: { type: "integer", minimum: 0, maximum: 23, default: 8, description: "Daily start hour (0-23)" },
          dailyStartMinute: { type: "integer", minimum: 0, maximum: 59, default: 0, description: "Daily start minute (0-59)" },
          dailyEndHour: { type: "integer", minimum: 0, maximum: 23, default: 22, description: "Daily end hour (0-23)" },
          dailyEndMinute: { type: "integer", minimum: 0, maximum: 59, default: 0, description: "Daily end minute (0-59)" },
          lunchBreakStartHour: { type: ["integer", "null"], minimum: 0, maximum: 23, description: "Lunch break start hour (optional)" },
          lunchBreakStartMinute: { type: "integer", minimum: 0, maximum: 59, default: 0, description: "Lunch break start minute" },
          lunchBreakEndHour: { type: ["integer", "null"], minimum: 0, maximum: 23, description: "Lunch break end hour (optional)" },
          lunchBreakEndMinute: { type: "integer", minimum: 0, maximum: 59, default: 0, description: "Lunch break end minute" },
          lunchBreakDurationMinutes: { type: ["integer", "null"], description: "Lunch break duration in minutes (optional)" },
          notes: { type: ["string", "null"], description: "Additional notes about the configuration" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ScheduleValidationResponse: {
        type: "object",
        properties: {
          isValid: { type: "boolean", description: "Whether the config fits within tournament timeframe" },
          message: { type: "string", description: "Validation result message" },
          details: {
            type: "object",
            properties: {
              totalMatches: { type: "integer", description: "Number of matches to schedule" },
              totalSlots: { type: "integer", description: "Number of time slots needed" },
              lastMatchEndTime: { type: "string", format: "date-time", description: "When the last match will end" },
              tournamentEndTime: { type: "string", format: "date-time", description: "Tournament end time" },
              overflowMinutes: { type: "integer", description: "How many minutes over the limit (if not valid)" },
            },
          },
          suggestions: {
            type: "array",
            items: { $ref: "#/components/schemas/OptimizationSuggestion" },
            description: "Array of optimization suggestions if config doesn't fit",
          },
        },
      },
      OptimizationSuggestion: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["increase_tables", "reduce_match_duration", "reduce_break_duration", "extend_schedule"], description: "Type of suggestion" },
          description: { type: "string", description: "Detailed description of the suggestion" },
          impact: {
            type: "object",
            properties: {
              matchDurationMinutes: { type: "integer", description: "Suggested match duration (if applicable)" },
              breakDurationMinutes: { type: "integer", description: "Suggested break duration (if applicable)" },
              numberOfTables: { type: "integer", description: "Suggested number of tables (if applicable)" },
              newEndDate: { type: "string", format: "date-time", description: "Suggested new end date (if applicable)" },
            },
            description: "Impact of this suggestion on the schedule",
          },
          priority: { type: "string", enum: ["high", "medium", "low"], description: "Priority of this suggestion" },
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
          },
          winnerEntryId: { type: "integer" },
          umpire: { type: "integer" },
          assistantUmpire: { type: "integer" },
          resultStatus: { type: "string", enum: ["pending", "approved", "rejected"] },
          reviewNotes: { type: "string" },
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
          matchId: { type: "integer", deprecated: true },
          setNumber: { type: "integer" },
          entryAScore: { type: "integer", default: 0 },
          entryBScore: { type: "integer", default: 0 },
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
          "changeReason",
        ],
        properties: {
          id: { type: "integer" },
          matchId: { type: "integer" },
          userId: { type: "integer" },
          previousElo: { type: "integer" },
          newElo: { type: "integer" },
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
          eloAtEntry: { type: "integer" },
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
          matchesPlayed: { type: "integer", default: 0 },
          matchesWon: { type: "integer", default: 0 },
          matchesLost: { type: "integer", default: 0 },
          setsWon: { type: "integer", default: 0 },
          setsLost: { type: "integer", default: 0 },
          setsDiff: { type: "integer", default: 0 },
          position: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      TournamentReferee: {
        type: "object",
        required: ["tournamentId", "refereeId", "role"],
        properties: {
          id: { type: "integer" },
          tournamentId: { type: "integer" },
          refereeId: { type: "integer" },
          role: { type: "string", enum: ["main", "assistant"] },
          isAvailable: { type: "boolean", default: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      KnockoutBracket: {
        type: "object",
        required: ["categoryId", "roundNumber", "bracketPosition"],
        properties: {
          id: { type: "integer" },
          categoryId: { type: "integer" },
          roundNumber: { type: "integer" },
          bracketPosition: { type: "integer" },
          scheduleId: { type: "integer" },
          matchId: { type: "integer" },
          entryAId: { type: "integer" },
          entryBId: { type: "integer" },
          winnerEntryId: { type: "integer" },
          nextBracketId: { type: "integer" },
          previousBracketAId: { type: "integer" },
          previousBracketBId: { type: "integer" },
          status: {
            type: "string",
            enum: ["pending", "ready", "in_progress", "completed"],
            default: "pending",
          },
          roundName: { type: "string", maxLength: 50 },
          isByeMatch: { type: "boolean", default: false },
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
            enum: ["pending", "approved", "rejected"],
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
    },
    parameters: {
      skipParam: {
        in: "query",
        name: "skip",
        schema: {
          type: "integer",
          default: 0,
        },
        description: "Number of records to skip for pagination",
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
  },
};

const options = {
  swaggerDefinition,
  apis: [
    "./src/routes/*.ts",
    "./src/controllers/*.ts",
    "./src/dto/*.ts",
    "./src/docs/*.ts",
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
