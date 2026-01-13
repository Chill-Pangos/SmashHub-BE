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
    { name: "Profiles", description: "User profile endpoints" },
    { name: "Roles", description: "Role management endpoints" },
    { name: "Permissions", description: "Permission management endpoints" },
    { name: "Tournaments", description: "Tournament management endpoints" },
    { name: "Format Types", description: "Format type management endpoints" },
    {
      name: "Tournament Contents",
      description: "Tournament content endpoints",
    },
    { name: "Entries", description: "Tournament entry endpoints" },
    { name: "Schedules", description: "Schedule management endpoints" },
    { name: "Matches", description: "Match management endpoints" },
    { name: "Match Sets", description: "Match set endpoints" },
    { name: "Match Formats", description: "Match format endpoints" },
    { name: "Content Rules", description: "Content rule endpoints" },
    { name: "ELO Scores", description: "ELO scoring system endpoints" },
    { name: "ELO Histories", description: "ELO history tracking endpoints" },
    { name: "Complaints", description: "Complaint management endpoints" },
    {
      name: "Complaint Messages",
      description: "Complaint messaging endpoints",
    },
    {
      name: "Complaint Workflows",
      description: "Complaint workflow tracking endpoints",
    },
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
        required: ["username", "email", "password"],
        properties: {
          id: { type: "integer" },
          username: { type: "string", maxLength: 50 },
          email: { type: "string", maxLength: 100 },
          password: { type: "string", maxLength: 255 },
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
      Profile: {
        type: "object",
        required: ["userId"],
        properties: {
          id: { type: "integer" },
          userId: { type: "integer" },
          avatarUrl: { type: "string", maxLength: 255 },
          dob: { type: "string", format: "date" },
          phoneNumber: { type: "string", maxLength: 20 },
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
        required: ["name", "startDate", "location"],
        properties: {
          id: { type: "integer" },
          name: { type: "string", maxLength: 100 },
          status: {
            type: "string",
            enum: ["upcoming", "ongoing", "completed"],
            default: "upcoming",
          },
          startDate: { type: "string", format: "date-time" },
          endDate: { type: "string", format: "date-time" },
          location: { type: "string", maxLength: 100 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      FormatType: {
        type: "object",
        required: ["typeName"],
        properties: {
          id: { type: "integer" },
          typeName: { type: "string", maxLength: 100 },
          description: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      TournamentContent: {
        type: "object",
        required: ["tournamentId", "name", "formatTypeId"],
        properties: {
          id: { type: "integer" },
          tournamentId: { type: "integer" },
          name: { type: "string", maxLength: 100 },
          formatTypeId: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Entry: {
        type: "object",
        required: ["contentId", "name"],
        properties: {
          id: { type: "integer" },
          contentId: { type: "integer" },
          name: { type: "string", maxLength: 100 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Schedule: {
        type: "object",
        required: ["contentId", "scheduledAt"],
        properties: {
          id: { type: "integer" },
          contentId: { type: "integer" },
          roundNumber: { type: "integer" },
          groupName: { type: "string", maxLength: 50 },
          scheduledAt: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
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
          coachAId: { type: "integer" },
          coachBId: { type: "integer" },
          isConfirmedByWinner: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MatchSet: {
        type: "object",
        required: ["matchId", "setNumber"],
        properties: {
          id: { type: "integer" },
          matchId: { type: "integer" },
          setNumber: { type: "integer" },
          entryAScore: { type: "integer", default: 0 },
          entryBScore: { type: "integer", default: 0 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MatchFormat: {
        type: "object",
        required: ["numberOfSingles", "numberOfDoubles"],
        properties: {
          id: { type: "integer" },
          numberOfSingles: { type: "integer" },
          numberOfDoubles: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ContentRule: {
        type: "object",
        required: ["contentId", "maxEntries", "maxSets", "racketCheck"],
        properties: {
          id: { type: "integer" },
          contentId: { type: "integer" },
          matchFormatId: { type: "integer" },
          maxEntries: { type: "integer" },
          maxSets: { type: "integer" },
          racketCheck: { type: "boolean" },
          isGroupStage: { type: "boolean" },
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
      Complaint: {
        type: "object",
        required: ["createdBy", "tournamentId", "topic", "description"],
        properties: {
          id: { type: "integer" },
          createdBy: { type: "integer" },
          tournamentId: { type: "integer" },
          matchId: { type: "integer" },
          topic: { type: "string", maxLength: 255 },
          description: { type: "string" },
          status: {
            type: "string",
            enum: [
              "submitted",
              "under_review",
              "escalated",
              "resolved",
              "rejected",
            ],
            default: "submitted",
          },
          currentHandlerId: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ComplaintMessage: {
        type: "object",
        required: ["complaintId", "senderId", "message"],
        properties: {
          id: { type: "integer" },
          complaintId: { type: "integer" },
          senderId: { type: "integer" },
          receiverId: { type: "integer" },
          message: { type: "string" },
          messageType: {
            type: "string",
            enum: ["comment", "request_info", "response"],
            default: "comment",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ComplaintWorkflow: {
        type: "object",
        required: ["complaintId"],
        properties: {
          id: { type: "integer" },
          complaintId: { type: "integer" },
          fromRole: { type: "string", maxLength: 50 },
          toRole: { type: "string", maxLength: 50 },
          fromUserId: { type: "integer" },
          toUserId: { type: "integer" },
          action: {
            type: "string",
            enum: ["submit", "forward", "approve", "reject", "request_info"],
          },
          note: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
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
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Error",
            },
            example: {
              message: "Resource not found",
            },
          },
        },
      },
      BadRequest: {
        description: "Bad request",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Error",
            },
            example: {
              message: "Invalid request data",
            },
          },
        },
      },
      InternalError: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Error",
            },
            example: {
              message: "Internal server error",
            },
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
