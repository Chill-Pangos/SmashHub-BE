import request from "supertest";
import app from "../../src/app";
import tournamentService from "../../src/services/tournament.service";
import { mockTournament, mockTournamentWithContents } from "../helpers";

// Mock the tournament service
jest.mock("../../src/services/tournament.service");

describe("Tournament GET APIs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/tournaments - Get All Tournaments", () => {
    const endpoint = "/api/tournaments";

    it("should return all tournaments with default pagination", async () => {
      const mockTournaments = [
        mockTournament,
        { ...mockTournament, id: 2, name: "Another Tournament" },
      ];
      (tournamentService.findAll as jest.Mock).mockResolvedValue(
        mockTournaments
      );

      const response = await request(app).get(endpoint).expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(2);
      expect(tournamentService.findAll).toHaveBeenCalledWith(0, 10);
    });

    it("should return tournaments with custom pagination (skip=10, limit=20)", async () => {
      const mockTournaments = Array(20)
        .fill(null)
        .map((_, i) => ({
          ...mockTournament,
          id: i + 1,
          name: `Tournament ${i + 1}`,
        }));
      (tournamentService.findAll as jest.Mock).mockResolvedValue(
        mockTournaments
      );

      const response = await request(app)
        .get(endpoint)
        .query({ skip: 10, limit: 20 })
        .expect(200);

      expect(response.body).toHaveLength(20);
      expect(tournamentService.findAll).toHaveBeenCalledWith(10, 20);
    });

    it("should return empty array when no tournaments exist", async () => {
      (tournamentService.findAll as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get(endpoint).expect(200);

      expect(response.body).toEqual([]);
    });

    it("should handle service error", async () => {
      (tournamentService.findAll as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app).get(endpoint).expect(500);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Error fetching tournaments");
    });
  });

  describe("GET /api/tournaments/search - Search Tournaments with Filters", () => {
    const endpoint = "/api/tournaments/search";

    it("should search tournaments with userId filter", async () => {
      const mockResponse = {
        tournaments: [mockTournamentWithContents],
        total: 1,
      };
      (
        tournamentService.findAllWithContentsFiltered as jest.Mock
      ).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(endpoint)
        .query({ userId: 5 })
        .expect(200);

      expect(response.body).toHaveProperty("tournaments");
      expect(response.body).toHaveProperty("total");
      expect(response.body.total).toBe(1);
      expect(tournamentService.findAllWithContentsFiltered).toHaveBeenCalled();
    });

    it("should search tournaments with age filters", async () => {
      const mockResponse = {
        tournaments: [mockTournamentWithContents],
        total: 1,
      };
      (
        tournamentService.findAllWithContentsFiltered as jest.Mock
      ).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(endpoint)
        .query({ minAge: 18, maxAge: 35 })
        .expect(200);

      expect(response.body.tournaments).toBeDefined();
      expect(response.body.total).toBe(1);
    });

    it("should search tournaments with ELO filters", async () => {
      const mockResponse = {
        tournaments: [mockTournamentWithContents],
        total: 5,
      };
      (
        tournamentService.findAllWithContentsFiltered as jest.Mock
      ).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(endpoint)
        .query({ minElo: 1200, maxElo: 1800 })
        .expect(200);

      expect(response.body.tournaments).toHaveLength(1);
      expect(response.body.total).toBe(5);
    });

    it("should search tournaments with gender filter", async () => {
      const mockResponse = {
        tournaments: [mockTournamentWithContents],
        total: 3,
      };
      (
        tournamentService.findAllWithContentsFiltered as jest.Mock
      ).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(endpoint)
        .query({ gender: "male" })
        .expect(200);

      expect(response.body.tournaments).toBeDefined();
      expect(response.body.total).toBe(3);
    });

    it("should search tournaments with multiple combined filters", async () => {
      const mockResponse = {
        tournaments: [mockTournamentWithContents],
        total: 1,
      };
      (
        tournamentService.findAllWithContentsFiltered as jest.Mock
      ).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(endpoint)
        .query({
          gender: "female",
          minAge: 18,
          maxAge: 30,
          minElo: 1200,
          maxElo: 1800,
          racketCheck: true,
          limit: 20,
        })
        .expect(200);

      expect(response.body).toHaveProperty("tournaments");
      expect(response.body).toHaveProperty("total");
    });

    it("should search tournaments by createdBy", async () => {
      const mockResponse = {
        tournaments: [mockTournamentWithContents],
        total: 3,
      };
      (
        tournamentService.findAllWithContentsFiltered as jest.Mock
      ).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(endpoint)
        .query({ createdBy: 3 })
        .expect(200);

      expect(response.body.tournaments).toBeDefined();
      expect(response.body.total).toBe(3);
    });

    it("should return empty result when no matches found", async () => {
      const mockResponse = {
        tournaments: [],
        total: 0,
      };
      (
        tournamentService.findAllWithContentsFiltered as jest.Mock
      ).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(endpoint)
        .query({ minElo: 9999 })
        .expect(200);

      expect(response.body.tournaments).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it("should handle boolean parameters correctly", async () => {
      const mockResponse = {
        tournaments: [mockTournamentWithContents],
        total: 1,
      };
      (
        tournamentService.findAllWithContentsFiltered as jest.Mock
      ).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get(endpoint)
        .query({ racketCheck: "true", isGroupStage: "false" })
        .expect(200);

      expect(response.body).toHaveProperty("tournaments");
    });

    it("should handle service error", async () => {
      (
        tournamentService.findAllWithContentsFiltered as jest.Mock
      ).mockRejectedValue(new Error("Database error"));

      const response = await request(app).get(endpoint).expect(500);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Error fetching tournaments");
    });
  });

  describe("GET /api/tournaments/:id - Get Tournament by ID", () => {
    const endpoint = "/api/tournaments";

    it("should return tournament with contents by ID", async () => {
      (tournamentService.findById as jest.Mock).mockResolvedValue(
        mockTournamentWithContents
      );

      const response = await request(app).get(`${endpoint}/1`).expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("name");
      expect(response.body).toHaveProperty("contents");
      expect(Array.isArray(response.body.contents)).toBe(true);
      expect(tournamentService.findById).toHaveBeenCalledWith(1);
    });

    it("should return 404 when tournament not found", async () => {
      (tournamentService.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get(`${endpoint}/999`).expect(404);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Tournament not found");
    });

    it("should handle invalid ID format", async () => {
      (tournamentService.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get(`${endpoint}/invalid-id`)
        .expect(404);

      expect(response.body).toHaveProperty("message");
    });

    it("should handle service error", async () => {
      (tournamentService.findById as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app).get(`${endpoint}/1`).expect(500);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Error fetching tournament");
    });
  });

  describe("GET /api/tournaments/status/:status - Get Tournaments by Status", () => {
    const endpoint = "/api/tournaments/status";

    it("should return upcoming tournaments", async () => {
      const mockUpcomingTournaments = [
        { ...mockTournament, status: "upcoming" },
        { ...mockTournament, id: 2, status: "upcoming" },
      ];
      (tournamentService.findByStatus as jest.Mock).mockResolvedValue(
        mockUpcomingTournaments
      );

      const response = await request(app)
        .get(`${endpoint}/upcoming`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].status).toBe("upcoming");
      expect(tournamentService.findByStatus).toHaveBeenCalledWith(
        "upcoming",
        0,
        10
      );
    });

    it("should return ongoing tournaments", async () => {
      const mockOngoingTournaments = [{ ...mockTournament, status: "ongoing" }];
      (tournamentService.findByStatus as jest.Mock).mockResolvedValue(
        mockOngoingTournaments
      );

      const response = await request(app)
        .get(`${endpoint}/ongoing`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe("ongoing");
    });

    it("should return completed tournaments", async () => {
      const mockCompletedTournaments = [
        { ...mockTournament, status: "completed" },
      ];
      (tournamentService.findByStatus as jest.Mock).mockResolvedValue(
        mockCompletedTournaments
      );

      const response = await request(app)
        .get(`${endpoint}/completed`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe("completed");
    });

    it("should return 400 for invalid status", async () => {
      const response = await request(app)
        .get(`${endpoint}/invalid-status`)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("Invalid status");
    });

    it("should support pagination parameters", async () => {
      const mockTournaments = Array(20)
        .fill(null)
        .map((_, i) => ({
          ...mockTournament,
          id: i + 1,
          status: "upcoming",
        }));
      (tournamentService.findByStatus as jest.Mock).mockResolvedValue(
        mockTournaments
      );

      const response = await request(app)
        .get(`${endpoint}/upcoming`)
        .query({ skip: 10, limit: 20 })
        .expect(200);

      expect(response.body).toHaveLength(20);
      expect(tournamentService.findByStatus).toHaveBeenCalledWith(
        "upcoming",
        10,
        20
      );
    });

    it("should return empty array when no tournaments with status exist", async () => {
      (tournamentService.findByStatus as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get(`${endpoint}/completed`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it("should handle service error", async () => {
      (tournamentService.findByStatus as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const response = await request(app)
        .get(`${endpoint}/upcoming`)
        .expect(500);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain(
        "Error fetching tournaments by status"
      );
    });
  });
});
