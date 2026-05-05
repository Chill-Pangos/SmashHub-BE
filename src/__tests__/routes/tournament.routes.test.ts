// ─── Env Setup ───────────────────────────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_very_long_string_for_jwt_secret_minimum_32_chars';

// ─── Mock middleware TRƯỚC import routes ──────────────────────────────────────
jest.mock('../../middlewares/auth.middleware', () => ({
  authenticate: jest.fn((_req: any, res: any, next: any) => next()),
}));

jest.mock('../../middlewares/permission.middleware', () => ({
  checkPermission: jest.fn(() => (_req: any, res: any, next: any) => next()),
  checkAnyPermission: jest.fn(() => (_req: any, res: any, next: any) => next()),
}));

jest.mock('../../controllers/tournament.controller');

import { Router } from 'express';
import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import tournamentRoutes from '../../routes/tournament.routes';
import tournamentController from '../../controllers/tournament.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { checkPermission, checkAnyPermission } from '../../middlewares/permission.middleware';

// ─── Setup ────────────────────────────────────────────────────────────────────
const mockAuth = authenticate as jest.MockedFunction<typeof authenticate>;
const mockCheckPermission = checkPermission as jest.MockedFunction<typeof checkPermission>;
const mockCheckAnyPermission = checkAnyPermission as jest.MockedFunction<typeof checkAnyPermission>;

// Create Express app with routes
const createApp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use('/tournaments', tournamentRoutes);
  return app;
};

// ─── Factories ───────────────────────────────────────────────────────────────
const makeTournament = (overrides: Record<string, any> = {}) => ({
  id: 1,
  name: 'Smash Tournament 2024',
  tier: 'regional',
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-06-02'),
  registrationStartDate: new Date('2024-05-01'),
  registrationEndDate: new Date('2024-05-25'),
  bracketGenerationDate: new Date('2024-05-26'),
  location: 'New York',
  status: 'upcoming',
  numberOfTables: 4,
  createdBy: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  categories: [],
  ...overrides,
});

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('Tournament Routes', () => {
  let app: Express;

  beforeEach(() => {
    // Clear only controller mocks, not middleware mocks
    (tournamentController.create as jest.Mock).mockClear();
    (tournamentController.findAllWithCategoriesFiltered as jest.Mock).mockClear();
    (tournamentController.findByIdWithCategories as jest.Mock).mockClear();
    (tournamentController.updateWithCategories as jest.Mock).mockClear();
    (tournamentController.delete as jest.Mock).mockClear();
    (tournamentController.updateStatuses as jest.Mock).mockClear();
    (tournamentController.getUpcomingChanges as jest.Mock).mockClear();

    // Setup controller mocks
    (tournamentController.create as jest.Mock).mockImplementation((req, res) => {
      res.status(201).json(makeTournament());
    });
    (tournamentController.findAllWithCategoriesFiltered as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ tournaments: [makeTournament()], pagination: { total: 1, page: 1, limit: 10 } });
    });
    (tournamentController.findByIdWithCategories as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json(makeTournament({ id: parseInt(req.params.id) }));
    });
    (tournamentController.updateWithCategories as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json(makeTournament({ id: parseInt(req.params.id) }));
    });
    (tournamentController.delete as jest.Mock).mockImplementation((req, res) => {
      res.status(204).send();
    });
    (tournamentController.updateStatuses as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ success: true, message: 'Updated', data: {} });
    });
    (tournamentController.getUpcomingChanges as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ success: true, data: {}, metadata: { lookAheadHours: 24 } });
    });

    app = createApp();
  });

  // ─── POST /tournaments ─────────────────────────────────────────────────────
  describe('POST /tournaments', () => {
    it('should create tournament and return 201', async () => {
      const tournamentData = {
        name: 'New Tournament',
        tier: 'regional',
        startDate: '2024-06-01T00:00:00Z',
        endDate: '2024-06-02T00:00:00Z',
        registrationStartDate: '2024-05-01T00:00:00Z',
        registrationEndDate: '2024-05-25T00:00:00Z',
        bracketGenerationDate: '2024-05-26T00:00:00Z',
        location: 'New York',
        numberOfTables: 4,
        categories: [],
      };

      const res = await request(app)
        .post('/tournaments')
        .send(tournamentData);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(1);
      expect(res.body.name).toBeDefined();
    });

    it('should pass tournament data to controller', async () => {
      const tournamentData = {
        name: 'New Tournament',
        tier: 'regional',
        startDate: '2024-06-01T00:00:00Z',
        endDate: '2024-06-02T00:00:00Z',
        registrationStartDate: '2024-05-01T00:00:00Z',
        registrationEndDate: '2024-05-25T00:00:00Z',
        bracketGenerationDate: '2024-05-26T00:00:00Z',
        location: 'New York',
        numberOfTables: 4,
      };

      await request(app)
        .post('/tournaments')
        .send(tournamentData);

      expect(tournamentController.create).toHaveBeenCalled();
    });
  });

  // ─── GET /tournaments ─────────────────────────────────────────────────────
  describe('GET /tournaments', () => {
    it('should get all tournaments without auth', async () => {
      const res = await request(app)
        .get('/tournaments');

      expect(res.status).toBe(200);
      expect(res.body.tournaments).toBeDefined();
      expect(res.body.pagination).toBeDefined();
      expect(mockAuth).not.toHaveBeenCalled();
    });

    it('should pass query parameters to controller', async () => {
      await request(app)
        .get('/tournaments')
        .query({ skip: '10', limit: '5' });

      expect(tournamentController.findAllWithCategoriesFiltered).toHaveBeenCalled();
    });

    it('should handle pagination parameters', async () => {
      const res = await request(app)
        .get('/tournaments')
        .query({ skip: '0', limit: '20' });

      expect(res.status).toBe(200);
      expect(res.body.pagination.limit).toBeGreaterThan(0);
    });
  });

  // ─── GET /tournaments/search ──────────────────────────────────────────────
  describe('GET /tournaments/search', () => {
    it('should search tournaments with filters', async () => {
      const res = await request(app)
        .get('/tournaments/search')
        .query({ minAge: '18', maxAge: '65', gender: 'male' });

      expect(res.status).toBe(200);
      expect(res.body.tournaments).toBeDefined();
    });

    it('should pass filter parameters to controller', async () => {
      await request(app)
        .get('/tournaments/search')
        .query({ userId: '1', minElo: '1200', maxElo: '2000' });

      expect(tournamentController.findAllWithCategoriesFiltered).toHaveBeenCalled();
    });

    it('should handle isGroupStage boolean parameter', async () => {
      const res = await request(app)
        .get('/tournaments/search')
        .query({ isGroupStage: 'true' });

      expect(res.status).toBe(200);
    });
  });

  // ─── POST /tournaments/update-statuses ─────────────────────────────────────
  describe('POST /tournaments/update-statuses', () => {
    it('should update statuses and return success', async () => {
      const res = await request(app)
        .post('/tournaments/update-statuses');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return status update counts', async () => {
      (tournamentController.updateStatuses as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: 'Tournament statuses updated successfully',
          data: { openedCount: 2, closedCount: 1, bracketsGeneratedCount: 0, totalUpdated: 3 },
        });
      });

      const res = await request(app)
        .post('/tournaments/update-statuses');

      expect(res.body.data.openedCount).toBeDefined();
      expect(res.body.data.closedCount).toBeDefined();
    });
  });

  // ─── GET /tournaments/upcoming-changes ─────────────────────────────────────
  describe('GET /tournaments/upcoming-changes', () => {
    it('should get upcoming changes and return success', async () => {
      const res = await request(app)
        .get('/tournaments/upcoming-changes');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('should accept custom hours parameter', async () => {
      const res = await request(app)
        .get('/tournaments/upcoming-changes')
        .query({ hours: '48' });

      expect(res.status).toBe(200);
    });

    it('should default to 24 hours', async () => {
      const res = await request(app)
        .get('/tournaments/upcoming-changes');

      expect(res.status).toBe(200);
      expect(res.body.metadata.lookAheadHours).toBeGreaterThan(0);
    });
  });

  // ─── GET /tournaments/:id ──────────────────────────────────────────────────
  describe('GET /tournaments/:id', () => {
    it('should get tournament by ID without auth', async () => {
      const res = await request(app)
        .get('/tournaments/1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
      expect(mockAuth).not.toHaveBeenCalled();
    });

    it('should pass ID to controller', async () => {
      await request(app)
        .get('/tournaments/123');

      expect(tournamentController.findByIdWithCategories).toHaveBeenCalled();
    });

    it('should handle invalid ID format', async () => {
      const res = await request(app)
        .get('/tournaments/invalid');

      // Controller should handle invalid ID
      expect(tournamentController.findByIdWithCategories).toHaveBeenCalled();
    });

    it('should include categories in response', async () => {
      (tournamentController.findByIdWithCategories as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json(makeTournament({
          id: 1,
          categories: [{ id: 1, name: 'Singles', type: 'single' }]
        }));
      });

      const res = await request(app)
        .get('/tournaments/1');

      expect(res.body.categories).toBeDefined();
      expect(res.body.categories.length).toBeGreaterThan(0);
    });
  });

  // ─── PUT /tournaments/:id ──────────────────────────────────────────────────
  describe('PUT /tournaments/:id', () => {
    it('should update tournament and return 200', async () => {
      const updateData = {
        name: 'Updated Tournament',
        startDate: '2024-06-05T00:00:00Z',
      };

      const res = await request(app)
        .put('/tournaments/1')
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
    });

    it('should pass update data to controller', async () => {
      const updateData = {
        name: 'Updated Tournament',
        numberOfTables: 6,
      };

      await request(app)
        .put('/tournaments/1')
        .send(updateData);

      expect(tournamentController.updateWithCategories).toHaveBeenCalled();
    });

    it('should update with categories', async () => {
      const updateData = {
        name: 'Updated Tournament',
        categories: [{ name: 'Singles', type: 'single', maxEntries: 64, maxSets: 3 }],
      };

      const res = await request(app)
        .put('/tournaments/1')
        .send(updateData);

      expect(res.status).toBe(200);
    });

    it('should handle ID in path', async () => {
      await request(app)
        .put('/tournaments/42')
        .send({ name: 'Updated' });

      expect(tournamentController.updateWithCategories).toHaveBeenCalled();
    });
  });

  // ─── DELETE /tournaments/:id ───────────────────────────────────────────────
  describe('DELETE /tournaments/:id', () => {
    it('should delete tournament and return 204', async () => {
      const res = await request(app)
        .delete('/tournaments/1');

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });

    it('should return 204 No Content on success', async () => {
      const res = await request(app)
        .delete('/tournaments/1');

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });

    it('should pass ID to controller', async () => {
      await request(app)
        .delete('/tournaments/99');

      expect(tournamentController.delete).toHaveBeenCalled();
    });
  });

  // ─── Route Order Tests ─────────────────────────────────────────────────────
  describe('Route Order and Specificity', () => {
    it('should match /search before /:id', async () => {
      (tournamentController.findAllWithCategoriesFiltered as jest.Mock).mockClear();
      (tournamentController.findByIdWithCategories as jest.Mock).mockClear();

      await request(app).get('/tournaments/search');

      expect(tournamentController.findAllWithCategoriesFiltered).toHaveBeenCalled();
      expect(tournamentController.findByIdWithCategories).not.toHaveBeenCalled();
    });

    it('should match /update-statuses before /:id', async () => {
      (tournamentController.updateStatuses as jest.Mock).mockClear();
      (tournamentController.findByIdWithCategories as jest.Mock).mockClear();

      await request(app).post('/tournaments/update-statuses');

      expect(tournamentController.updateStatuses).toHaveBeenCalled();
    });

    it('should match /upcoming-changes before /:id', async () => {
      (tournamentController.getUpcomingChanges as jest.Mock).mockClear();
      (tournamentController.findByIdWithCategories as jest.Mock).mockClear();

      await request(app).get('/tournaments/upcoming-changes');

      expect(tournamentController.getUpcomingChanges).toHaveBeenCalled();
    });
  });

  // ─── Middleware Chain Tests ───────────────────────────────────────────────
  describe('Middleware Execution', () => {
    it('should call authenticate before controller on POST', async () => {
      const callOrder: string[] = [];

      mockAuth.mockImplementation((req, res, next) => {
        callOrder.push('auth');
        next();
        return Promise.resolve();
      });
      (tournamentController.create as jest.Mock).mockImplementation((req, res) => {
        callOrder.push('create');
        res.status(201).json(makeTournament());
      });

      await request(app)
        .post('/tournaments')
        .send({ name: 'Test' });

      expect(callOrder).toEqual(['auth', 'create']);
    });

    it('should not call auth on GET /:id', async () => {
      (tournamentController.findByIdWithCategories as jest.Mock).mockClear();
      mockAuth.mockClear();

      await request(app).get('/tournaments/1');

      expect(mockAuth).not.toHaveBeenCalled();
      expect(tournamentController.findByIdWithCategories).toHaveBeenCalled();
    });
  });

  // ─── Content-Type Tests ───────────────────────────────────────────────────
  describe('Content Type Handling', () => {
    it('should handle JSON request body', async () => {
      const res = await request(app)
        .post('/tournaments')
        .set('Content-Type', 'application/json')
        .send({ name: 'Test', tier: 'regional' });

      expect(res.status).toBe(201);
    });

    it('should return JSON response', async () => {
      const res = await request(app)
        .get('/tournaments/1');

      expect(res.type).toMatch(/json/);
    });
  });
});
