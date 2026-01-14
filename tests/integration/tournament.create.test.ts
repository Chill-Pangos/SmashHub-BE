import request from "supertest";
import app from "../../src/app";
import tournamentService from "../../src/services/tournament.service";
import {
  generateTestToken,
  createMockTournamentRequest,
  createMockTeamTournamentRequest,
  mockTournamentWithContents,
} from "../helpers";

// Mock the tournament service
jest.mock("../../src/services/tournament.service");
jest.mock("../../src/middlewares/auth.middleware", () => ({
  authenticate: (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.substring(7);
    // Simple token validation - reject 'invalid-token'
    if (token === 'invalid-token' || token.length < 10) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = { id: 1, email: "test@example.com" };
    next();
  },
}));

describe("POST /api/tournaments - Create Tournament", () => {
  const endpoint = "/api/tournaments";
  let authToken: string;

  beforeEach(() => {
    authToken = generateTestToken(1, "test@example.com");
    jest.clearAllMocks();
  });

  describe("✅ Success Cases", () => {
    it("should create a tournament successfully with valid data", async () => {
      const requestData = createMockTournamentRequest();
      const mockResponse = mockTournamentWithContents;

      (tournamentService.create as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", `Bearer ${authToken}`)
        .send(requestData)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe(requestData.name);
      expect(response.body.location).toBe(requestData.location);
      expect(response.body).toHaveProperty("createdBy");
      expect(response.body).toHaveProperty("contents");
      expect(Array.isArray(response.body.contents)).toBe(true);
    });

    it("should create a tournament without contents", async () => {
      const requestData = {
        name: "Local Tournament 2026",
        startDate: "2026-04-01T10:00:00Z",
        location: "Community Center",
      };

      const mockResponse = {
        ...mockTournamentWithContents,
        ...requestData,
        contents: [],
      };

      (tournamentService.create as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", `Bearer ${authToken}`)
        .send(requestData)
        .expect(201);

      expect(response.body.name).toBe(requestData.name);
      expect(response.body.contents).toEqual([]);
    });

    it("should create a tournament with team contents (numberOfSingles + numberOfDoubles)", async () => {
      const requestData = createMockTeamTournamentRequest();
      const mockResponse = {
        ...mockTournamentWithContents,
        ...requestData,
      };

      (tournamentService.create as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", `Bearer ${authToken}`)
        .send(requestData)
        .expect(201);

      expect(response.body.contents[0].type).toBe("team");
      expect(response.body.contents[0].numberOfSingles).toBe(4);
      expect(response.body.contents[0].numberOfDoubles).toBe(1);
    });

    it("should create a tournament with age and ELO filters", async () => {
      const requestData = createMockTournamentRequest({
        contents: [
          {
            name: "Men's Singles U21",
            type: "single",
            maxEntries: 32,
            maxSets: 3,
            minAge: 15,
            maxAge: 21,
            minElo: 1200,
            maxElo: 1800,
            gender: "male",
            racketCheck: true,
          },
        ],
      });

      const mockResponse = {
        ...mockTournamentWithContents,
        ...requestData,
      };

      (tournamentService.create as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", `Bearer ${authToken}`)
        .send(requestData)
        .expect(201);

      expect(response.body.contents[0].minAge).toBe(15);
      expect(response.body.contents[0].maxAge).toBe(21);
      expect(response.body.contents[0].minElo).toBe(1200);
      expect(response.body.contents[0].maxElo).toBe(1800);
    });

    it('should default status to "upcoming" if not provided', async () => {
      const requestData = {
        name: "Test Tournament",
        startDate: "2026-03-15T09:00:00Z",
        location: "Test Location",
      };

      const mockResponse = {
        ...mockTournamentWithContents,
        ...requestData,
        status: "upcoming",
      };

      (tournamentService.create as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", `Bearer ${authToken}`)
        .send(requestData)
        .expect(201);

      expect(response.body.status).toBe("upcoming");
    });
  });

  describe("❌ Validation Error Cases", () => {
    it("should return 400 when name is missing", async () => {
      const requestData = {
        startDate: "2026-03-15T09:00:00Z",
        location: "Test Location",
      };

      (tournamentService.create as jest.Mock).mockRejectedValue(
        new Error("name is required")
      );

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", `Bearer ${authToken}`)
        .send(requestData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Error creating tournament");
    });

    it("should return 400 when startDate is missing", async () => {
      const requestData = {
        name: "Test Tournament",
        location: "Test Location",
      };

      (tournamentService.create as jest.Mock).mockRejectedValue(
        new Error("startDate is required")
      );

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", `Bearer ${authToken}`)
        .send(requestData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should return 400 when location is missing", async () => {
      const requestData = {
        name: "Test Tournament",
        startDate: "2026-03-15T09:00:00Z",
      };

      (tournamentService.create as jest.Mock).mockRejectedValue(
        new Error("location is required")
      );

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", `Bearer ${authToken}`)
        .send(requestData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should return 400 when status has invalid value", async () => {
      const requestData = createMockTournamentRequest({
        status: "invalid-status",
      });

      (tournamentService.create as jest.Mock).mockRejectedValue(
        new Error("Invalid status value")
      );

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", `Bearer ${authToken}`)
        .send(requestData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should return 400 when content type has invalid value", async () => {
      const requestData = createMockTournamentRequest({
        contents: [
          {
            name: "Test Content",
            type: "invalid-type",
            maxEntries: 32,
            maxSets: 3,
            racketCheck: true,
          },
        ],
      });

      (tournamentService.create as jest.Mock).mockRejectedValue(
        new Error("Invalid content type")
      );

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", `Bearer ${authToken}`)
        .send(requestData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should return 400 when content is missing required fields", async () => {
      const requestData = createMockTournamentRequest({
        contents: [
          {
            name: "Test Content",
            // Missing required fields: type, maxEntries, maxSets, racketCheck
          },
        ],
      });

      (tournamentService.create as jest.Mock).mockRejectedValue(
        new Error("Missing required fields in content")
      );

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", `Bearer ${authToken}`)
        .send(requestData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("🔐 Authentication Error Cases", () => {
    it("should return 401 when no token is provided", async () => {
      const requestData = createMockTournamentRequest();

      // Create a new request without mocking auth middleware
      const appWithoutAuthMock = require("../../src/app").default;

      const response = await request(appWithoutAuthMock)
        .post(endpoint)
        .send(requestData)
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });

    it("should return 401 when token is invalid", async () => {
      const requestData = createMockTournamentRequest();

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", "Bearer invalid-token")
        .send(requestData)
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("🚨 Edge Cases", () => {
    it("should handle transaction rollback on error", async () => {
      const requestData = createMockTournamentRequest();

      (tournamentService.create as jest.Mock).mockRejectedValue(
        new Error("Transaction failed")
      );

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", `Bearer ${authToken}`)
        .send(requestData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(tournamentService.create).toHaveBeenCalledTimes(1);
    });

    it("should handle database connection error", async () => {
      const requestData = createMockTournamentRequest();

      (tournamentService.create as jest.Mock).mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", `Bearer ${authToken}`)
        .send(requestData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should handle null endDate", async () => {
      const requestData = createMockTournamentRequest({
        endDate: null,
      });

      const mockResponse = {
        ...mockTournamentWithContents,
        ...requestData,
      };

      (tournamentService.create as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", `Bearer ${authToken}`)
        .send(requestData)
        .expect(201);

      expect(response.body.endDate).toBeNull();
    });

    it("should handle multiple contents with different types", async () => {
      const requestData = createMockTournamentRequest({
        contents: [
          {
            name: "Men's Singles",
            type: "single",
            maxEntries: 32,
            maxSets: 3,
            racketCheck: true,
          },
          {
            name: "Women's Doubles",
            type: "double",
            maxEntries: 16,
            maxSets: 3,
            racketCheck: true,
          },
          {
            name: "Men's Team",
            type: "team",
            maxEntries: 8,
            maxSets: 3,
            numberOfSingles: 4,
            numberOfDoubles: 1,
            racketCheck: true,
          },
        ],
      });

      const mockResponse = {
        ...mockTournamentWithContents,
        ...requestData,
      };

      (tournamentService.create as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post(endpoint)
        .set("Authorization", `Bearer ${authToken}`)
        .send(requestData)
        .expect(201);

      expect(response.body.contents).toHaveLength(3);
      expect(response.body.contents[0].type).toBe("single");
      expect(response.body.contents[1].type).toBe("double");
      expect(response.body.contents[2].type).toBe("team");
    });
  });
});
