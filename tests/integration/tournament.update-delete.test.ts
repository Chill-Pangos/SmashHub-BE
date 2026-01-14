import request from "supertest";
import app from "../../src/app";
import tournamentService from "../../src/services/tournament.service";
import {
  generateTestToken,
  createMockTournamentRequest,
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

describe("Tournament Update & Delete APIs", () => {
  let authToken: string;

  beforeEach(() => {
    authToken = generateTestToken(1, "test@example.com");
    jest.clearAllMocks();
  });

  describe("PUT /api/tournaments/:id - Update Tournament", () => {
    const endpoint = "/api/tournaments";

    describe("✅ Success Cases", () => {
      it("should update tournament info without touching contents", async () => {
        const updateData = {
          name: "Spring Championship 2026 - Updated",
          status: "ongoing",
          location: "National Stadium - Hall A",
        };

        const mockResponse = {
          ...mockTournamentWithContents,
          ...updateData,
          updatedAt: new Date(),
        };

        (tournamentService.update as jest.Mock).mockResolvedValue(mockResponse);

        const response = await request(app)
          .put(`${endpoint}/1`)
          .set("Authorization", `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.name).toBe(updateData.name);
        expect(response.body.status).toBe(updateData.status);
        expect(response.body.location).toBe(updateData.location);
      });

      it("should update only tournament status", async () => {
        const updateData = { status: "ongoing" };

        const mockResponse = {
          ...mockTournamentWithContents,
          status: "ongoing",
        };

        (tournamentService.update as jest.Mock).mockResolvedValue(mockResponse);

        const response = await request(app)
          .put(`${endpoint}/1`)
          .set("Authorization", `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.status).toBe("ongoing");
      });

      it("should update tournament and replace all contents", async () => {
        const updateData = {
          name: "Spring Championship 2026 - Final",
          status: "completed",
          contents: [
            {
              name: "Men's Singles Final",
              type: "single",
              maxEntries: 16,
              maxSets: 5,
              minAge: 18,
              maxAge: 35,
              gender: "male",
              racketCheck: true,
              isGroupStage: false,
            },
          ],
        };

        const mockResponse = {
          ...mockTournamentWithContents,
          ...updateData,
        };

        (tournamentService.update as jest.Mock).mockResolvedValue(mockResponse);

        const response = await request(app)
          .put(`${endpoint}/1`)
          .set("Authorization", `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.name).toBe(updateData.name);
        expect(response.body.status).toBe(updateData.status);
        expect(response.body.contents).toHaveLength(1);
        expect(response.body.contents[0].name).toBe("Men's Singles Final");
      });

      it("should update tournament and remove all contents", async () => {
        const updateData = {
          name: "Tournament Name",
          contents: [],
        };

        const mockResponse = {
          ...mockTournamentWithContents,
          ...updateData,
        };

        (tournamentService.update as jest.Mock).mockResolvedValue(mockResponse);

        const response = await request(app)
          .put(`${endpoint}/1`)
          .set("Authorization", `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.contents).toEqual([]);
      });

      it("should update startDate and endDate", async () => {
        const updateData = {
          startDate: "2026-04-01T09:00:00Z",
          endDate: "2026-04-10T18:00:00Z",
        };

        const mockResponse = {
          ...mockTournamentWithContents,
          ...updateData,
        };

        (tournamentService.update as jest.Mock).mockResolvedValue(mockResponse);

        const response = await request(app)
          .put(`${endpoint}/1`)
          .set("Authorization", `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.startDate).toBeDefined();
        expect(response.body.endDate).toBeDefined();
      });
    });

    describe("❌ Error Cases", () => {
      it("should return 404 when tournament not found", async () => {
        const updateData = { name: "Updated Name" };

        (tournamentService.update as jest.Mock).mockResolvedValue(null);

        const response = await request(app)
          .put(`${endpoint}/999`)
          .set("Authorization", `Bearer ${authToken}`)
          .send(updateData)
          .expect(404);

        expect(response.body).toHaveProperty("message");
        expect(response.body.message).toContain("Tournament not found");
      });

      it("should return 400 for invalid data", async () => {
        const updateData = { status: "invalid-status" };

        (tournamentService.update as jest.Mock).mockRejectedValue(
          new Error("Invalid status value")
        );

        const response = await request(app)
          .put(`${endpoint}/1`)
          .set("Authorization", `Bearer ${authToken}`)
          .send(updateData)
          .expect(400);

        expect(response.body).toHaveProperty("message");
      });

      it("should return 401 when not authenticated", async () => {
        const updateData = { name: "Updated Name" };

        const response = await request(app)
          .put(`${endpoint}/1`)
          .send(updateData)
          .expect(401);

        expect(response.body).toHaveProperty("message");
      });

      it("should return 401 with invalid token", async () => {
        const updateData = { name: "Updated Name" };

        const response = await request(app)
          .put(`${endpoint}/1`)
          .set("Authorization", "Bearer invalid-token")
          .send(updateData)
          .expect(401);

        expect(response.body).toHaveProperty("message");
      });

      it("should handle database error", async () => {
        const updateData = { name: "Updated Name" };

        (tournamentService.update as jest.Mock).mockRejectedValue(
          new Error("Database connection failed")
        );

        const response = await request(app)
          .put(`${endpoint}/1`)
          .set("Authorization", `Bearer ${authToken}`)
          .send(updateData)
          .expect(400);

        expect(response.body).toHaveProperty("message");
        expect(response.body.message).toContain("Error updating tournament");
      });
    });

    describe("🚨 Edge Cases", () => {
      it("should handle empty update object", async () => {
        const updateData = {};

        const mockResponse = mockTournamentWithContents;

        (tournamentService.update as jest.Mock).mockResolvedValue(mockResponse);

        const response = await request(app)
          .put(`${endpoint}/1`)
          .set("Authorization", `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty("id");
      });

      it("should handle partial content updates with validation", async () => {
        const updateData = {
          contents: [
            {
              name: "New Content",
              type: "single",
              maxEntries: 32,
              maxSets: 3,
              racketCheck: true,
            },
          ],
        };

        const mockResponse = {
          ...mockTournamentWithContents,
          contents: updateData.contents,
        };

        (tournamentService.update as jest.Mock).mockResolvedValue(mockResponse);

        const response = await request(app)
          .put(`${endpoint}/1`)
          .set("Authorization", `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.contents).toHaveLength(1);
      });
    });
  });

  describe("DELETE /api/tournaments/:id - Delete Tournament", () => {
    const endpoint = "/api/tournaments";

    describe("✅ Success Cases", () => {
      it("should delete tournament successfully", async () => {
        (tournamentService.delete as jest.Mock).mockResolvedValue(1);

        const response = await request(app)
          .delete(`${endpoint}/1`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(204);

        expect(response.body).toEqual({});
        expect(tournamentService.delete).toHaveBeenCalledWith(1);
      });

      it("should delete tournament with cascade (contents deleted)", async () => {
        (tournamentService.delete as jest.Mock).mockResolvedValue(1);

        const response = await request(app)
          .delete(`${endpoint}/5`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(204);

        expect(tournamentService.delete).toHaveBeenCalledWith(5);
      });
    });

    describe("❌ Error Cases", () => {
      it("should return 404 when tournament not found", async () => {
        (tournamentService.delete as jest.Mock).mockResolvedValue(0);

        const response = await request(app)
          .delete(`${endpoint}/999`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(404);

        expect(response.body).toHaveProperty("message");
        expect(response.body.message).toContain("Tournament not found");
      });

      it("should return 401 when not authenticated", async () => {
        const response = await request(app).delete(`${endpoint}/1`).expect(401);

        expect(response.body).toHaveProperty("message");
      });

      it("should return 401 with invalid token", async () => {
        const response = await request(app)
          .delete(`${endpoint}/1`)
          .set("Authorization", "Bearer invalid-token")
          .expect(401);

        expect(response.body).toHaveProperty("message");
      });

      it("should handle database error", async () => {
        (tournamentService.delete as jest.Mock).mockRejectedValue(
          new Error("Database connection failed")
        );

        const response = await request(app)
          .delete(`${endpoint}/1`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(500);

        expect(response.body).toHaveProperty("message");
        expect(response.body.message).toContain("Error deleting tournament");
      });

      it("should handle invalid ID format", async () => {
        (tournamentService.delete as jest.Mock).mockResolvedValue(0);

        const response = await request(app)
          .delete(`${endpoint}/invalid-id`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(404);

        expect(response.body).toHaveProperty("message");
      });
    });

    describe("🚨 Edge Cases", () => {
      it("should handle deletion of tournament with active entries", async () => {
        // In real scenario, this might fail due to foreign key constraints
        (tournamentService.delete as jest.Mock).mockRejectedValue(
          new Error("Cannot delete tournament with active entries")
        );

        const response = await request(app)
          .delete(`${endpoint}/1`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(500);

        expect(response.body).toHaveProperty("message");
      });

      it("should handle concurrent deletion attempts", async () => {
        (tournamentService.delete as jest.Mock).mockResolvedValue(1);

        const response1 = await request(app)
          .delete(`${endpoint}/1`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(204);

        // Second attempt should fail (tournament already deleted)
        (tournamentService.delete as jest.Mock).mockResolvedValue(0);

        const response2 = await request(app)
          .delete(`${endpoint}/1`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(404);

        expect(response2.body.message).toContain("Tournament not found");
      });
    });
  });
});
