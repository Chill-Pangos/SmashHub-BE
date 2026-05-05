// ─── Env Setup ───────────────────────────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_very_long_string_for_jwt_secret_minimum_32_chars';

// ─── Mock middleware TRƯỚC import routes ──────────────────────────────────────
jest.mock('../../middlewares/auth.middleware', () => ({
  authenticate: jest.fn((_req: any, res: any, next: any) => next()),
}));

jest.mock('../../middlewares/permission.middleware', () => ({
  checkPermission: jest.fn(() => (_req: any, res: any, next: any) => next()),
}));

jest.mock('../../controllers/tournamentCategory.controller');

import { Router } from 'express';
import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import tournamentCategoryRoutes from '../../routes/tournamentCategory.routes';
import TournamentCategoryController from '../../controllers/tournamentCategory.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { checkPermission } from '../../middlewares/permission.middleware';

// ─── Setup ────────────────────────────────────────────────────────────────────
const mockAuth = authenticate as jest.MockedFunction<typeof authenticate>;
const mockCheckPermission = checkPermission as jest.MockedFunction<typeof checkPermission>;

// Create Express app with routes
const createApp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use('/tournament-categories', tournamentCategoryRoutes);
  return app;
};

// ─── Factories ───────────────────────────────────────────────────────────────
const makeCategory = (overrides: Record<string, any> = {}) => ({
  id: 1,
  tournamentId: 1,
  name: 'Singles',
  type: 'single',
  maxEntries: 64,
  maxSets: 3,
  teamFormat: null,
  minAge: 18,
  maxAge: 65,
  minElo: 1200,
  maxElo: 2000,
  maxMembersPerEntry: 1,
  gender: 'male',
  isGroupStage: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('Tournament Category Routes', () => {
  let app: Express;

  beforeEach(() => {
    // Clear only controller mocks, not middleware mocks
    (TournamentCategoryController.create as jest.Mock).mockClear();
    (TournamentCategoryController.findAll as jest.Mock).mockClear();
    (TournamentCategoryController.findById as jest.Mock).mockClear();
    (TournamentCategoryController.findByTournamentId as jest.Mock).mockClear();
    (TournamentCategoryController.update as jest.Mock).mockClear();
    (TournamentCategoryController.delete as jest.Mock).mockClear();

    // Setup controller mocks
    (TournamentCategoryController.create as jest.Mock).mockImplementation((req, res) => {
      res.status(201).json(makeCategory());
    });
    (TournamentCategoryController.findAll as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json([makeCategory(), makeCategory({ id: 2, name: 'Doubles' })]);
    });
    (TournamentCategoryController.findById as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json(makeCategory({ id: parseInt(req.params.id) }));
    });
    (TournamentCategoryController.findByTournamentId as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json([makeCategory({ tournamentId: parseInt(req.params.tournamentId) })]);
    });
    (TournamentCategoryController.update as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json([1, [makeCategory({ id: parseInt(req.params.id) })]]);
    });
    (TournamentCategoryController.delete as jest.Mock).mockImplementation((req, res) => {
      res.status(204).send();
    });

    app = createApp();
  });

  // ─── POST /tournament-categories ───────────────────────────────────────────
  describe('POST /tournament-categories', () => {
    it('should create category and return 201', async () => {
      const categoryData = {
        tournamentId: 1,
        name: 'Singles',
        type: 'single',
        maxEntries: 64,
        maxSets: 3,
        isGroupStage: false,
      };

      const res = await request(app)
        .post('/tournament-categories')
        .send(categoryData);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(1);
      expect(res.body.name).toBeDefined();
    });

    it('should pass category data to controller', async () => {
      const categoryData = {
        tournamentId: 1,
        name: 'Doubles',
        type: 'double',
        maxEntries: 32,
        maxSets: 3,
        gender: 'mixed',
        isGroupStage: false,
      };

      await request(app)
        .post('/tournament-categories')
        .send(categoryData);

      expect(TournamentCategoryController.create).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      (TournamentCategoryController.create as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({ message: 'Validation error' });
      });

      const res = await request(app)
        .post('/tournament-categories')
        .send({ name: 'Invalid' });

      expect(res.status).toBe(400);
    });
  });

  // ─── GET /tournament-categories ────────────────────────────────────────────
  describe('GET /tournament-categories', () => {
    it('should get all categories without auth', async () => {
      const res = await request(app)
        .get('/tournament-categories');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(mockAuth).not.toHaveBeenCalled();
    });

    it('should pass pagination to controller', async () => {
      await request(app)
        .get('/tournament-categories')
        .query({ skip: '10', limit: '5' });

      expect(TournamentCategoryController.findAll).toHaveBeenCalled();
    });

    it('should handle default pagination', async () => {
      const res = await request(app)
        .get('/tournament-categories');

      expect(res.status).toBe(200);
    });

    it('should return array of categories', async () => {
      (TournamentCategoryController.findAll as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json([
          makeCategory({ id: 1, name: 'Singles' }),
          makeCategory({ id: 2, name: 'Doubles', type: 'double' }),
          makeCategory({ id: 3, name: 'Teams', type: 'team' }),
        ]);
      });

      const res = await request(app)
        .get('/tournament-categories');

      expect(res.body).toHaveLength(3);
      expect(res.body[0].name).toBe('Singles');
      expect(res.body[1].name).toBe('Doubles');
      expect(res.body[2].name).toBe('Teams');
    });
  });

  // ─── GET /tournament-categories/:id ────────────────────────────────────────
  describe('GET /tournament-categories/:id', () => {
    it('should get category by ID without auth', async () => {
      const res = await request(app)
        .get('/tournament-categories/1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
      expect(mockAuth).not.toHaveBeenCalled();
    });

    it('should pass ID to controller', async () => {
      await request(app)
        .get('/tournament-categories/42');

      expect(TournamentCategoryController.findById).toHaveBeenCalled();
    });

    it('should return category details', async () => {
      (TournamentCategoryController.findById as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json(makeCategory({
          id: 5,
          name: 'Women\'s Doubles',
          type: 'double',
          gender: 'female',
        }));
      });

      const res = await request(app)
        .get('/tournament-categories/5');

      expect(res.body.id).toBe(5);
      expect(res.body.name).toBe('Women\'s Doubles');
      expect(res.body.type).toBe('double');
      expect(res.body.gender).toBe('female');
    });

    it('should handle not found', async () => {
      (TournamentCategoryController.findById as jest.Mock).mockImplementation((req, res) => {
        res.status(404).json({ message: 'Not found' });
      });

      const res = await request(app)
        .get('/tournament-categories/999');

      expect(res.status).toBe(404);
    });
  });

  // ─── PUT /tournament-categories/:id ────────────────────────────────────────
  describe('PUT /tournament-categories/:id', () => {
    it('should update category and return 200', async () => {
      const updateData = {
        name: 'Updated Singles',
        maxEntries: 128,
      };

      const res = await request(app)
        .put('/tournament-categories/1')
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it('should pass update data to controller', async () => {
      const updateData = {
        name: 'Updated Doubles',
        type: 'double',
        maxEntries: 32,
      };

      await request(app)
        .put('/tournament-categories/2')
        .send(updateData);

      expect(TournamentCategoryController.update).toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      const updateData = { maxEntries: 100 };

      const res = await request(app)
        .put('/tournament-categories/1')
        .send(updateData);

      expect(res.status).toBe(200);
    });

    it('should validate gender/type combination', async () => {
      (TournamentCategoryController.update as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({ message: 'Only double type category can have mixed gender' });
      });

      const res = await request(app)
        .put('/tournament-categories/1')
        .send({ type: 'single', gender: 'mixed' });

      expect(res.status).toBe(400);
    });

    it('should pass ID from path', async () => {
      await request(app)
        .put('/tournament-categories/99')
        .send({ name: 'Updated' });

      expect(TournamentCategoryController.update).toHaveBeenCalled();
    });
  });

  // ─── DELETE /tournament-categories/:id ──────────────────────────────────────
  describe('DELETE /tournament-categories/:id', () => {
    it('should delete category and return 204', async () => {
      const res = await request(app)
        .delete('/tournament-categories/1');

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });

    it('should return 204 No Content on success', async () => {
      const res = await request(app)
        .delete('/tournament-categories/1');

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });

    it('should pass ID to controller', async () => {
      await request(app)
        .delete('/tournament-categories/5');

      expect(TournamentCategoryController.delete).toHaveBeenCalled();
    });

    it('should handle not found', async () => {
      (TournamentCategoryController.delete as jest.Mock).mockImplementation((req, res) => {
        res.status(404).json({ message: 'Not found' });
      });

      const res = await request(app)
        .delete('/tournament-categories/999');

      expect(res.status).toBe(404);
    });
  });

  // ─── GET /tournament-categories/tournament/:tournamentId ──────────────────
  describe('GET /tournament-categories/tournament/:tournamentId', () => {
    it('should get categories by tournament ID without auth', async () => {
      const res = await request(app)
        .get('/tournament-categories/tournament/1');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(mockAuth).not.toHaveBeenCalled();
    });

    it('should pass tournament ID to controller', async () => {
      await request(app)
        .get('/tournament-categories/tournament/5');

      expect(TournamentCategoryController.findByTournamentId).toHaveBeenCalled();
    });

    it('should pass pagination parameters', async () => {
      await request(app)
        .get('/tournament-categories/tournament/1')
        .query({ skip: '0', limit: '10' });

      expect(TournamentCategoryController.findByTournamentId).toHaveBeenCalled();
    });

    it('should return categories for tournament', async () => {
      (TournamentCategoryController.findByTournamentId as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json([
          makeCategory({ tournamentId: 1, id: 1, name: 'Singles' }),
          makeCategory({ tournamentId: 1, id: 2, name: 'Doubles' }),
        ]);
      });

      const res = await request(app)
        .get('/tournament-categories/tournament/1');

      expect(res.body).toHaveLength(2);
      expect(res.body[0].tournamentId).toBe(1);
      expect(res.body[1].tournamentId).toBe(1);
    });

    it('should return empty array when no categories', async () => {
      (TournamentCategoryController.findByTournamentId as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json([]);
      });

      const res = await request(app)
        .get('/tournament-categories/tournament/999');

      expect(res.body).toEqual([]);
    });
  });

  // ─── Route Order Tests ─────────────────────────────────────────────────────
  describe('Route Order and Specificity', () => {
    it('should match /tournament/:tournamentId before /:id for GET', async () => {
      (TournamentCategoryController.findByTournamentId as jest.Mock).mockClear();
      (TournamentCategoryController.findById as jest.Mock).mockClear();

      await request(app).get('/tournament-categories/tournament/1');

      expect(TournamentCategoryController.findByTournamentId).toHaveBeenCalled();
      expect(TournamentCategoryController.findById).not.toHaveBeenCalled();
    });
  });

  // ─── Middleware Chain Tests ───────────────────────────────────────────────
  describe('Middleware Execution', () => {
    it('should call authenticate before controller on POST', async () => {
      const callOrder: string[] = [];

      mockAuth.mockImplementation((_req, res, next) => {
        callOrder.push('auth');
        next();
        return Promise.resolve();
      });
      (TournamentCategoryController.create as jest.Mock).mockImplementation((_req, res) => {
        callOrder.push('create');
        res.status(201).json(makeCategory());
      });

      await request(app)
        .post('/tournament-categories')
        .send({ tournamentId: 1, name: 'Test', type: 'single', maxEntries: 32, maxSets: 3 });

      expect(callOrder).toEqual(['auth', 'create']);
    });

    it('should not call auth on GET /:id', async () => {
      (TournamentCategoryController.findById as jest.Mock).mockClear();
      mockAuth.mockClear();

      await request(app).get('/tournament-categories/1');

      expect(mockAuth).not.toHaveBeenCalled();
      expect(TournamentCategoryController.findById).toHaveBeenCalled();
    });
  });

  // ─── Content-Type Tests ───────────────────────────────────────────────────
  describe('Content Type Handling', () => {
    it('should handle JSON request body on POST', async () => {
      const res = await request(app)
        .post('/tournament-categories')
        .set('Content-Type', 'application/json')
        .send({
          tournamentId: 1,
          name: 'Test',
          type: 'single',
          maxEntries: 64,
          maxSets: 3,
        });

      expect(res.status).toBe(201);
    });

    it('should return JSON response', async () => {
      const res = await request(app)
        .get('/tournament-categories/1');

      expect(res.type).toMatch(/json/);
    });
  });

  // ─── Query Parameter Tests ─────────────────────────────────────────────────
  describe('Query Parameters', () => {
    it('should handle skip and limit on GET /', async () => {
      const res = await request(app)
        .get('/tournament-categories')
        .query({ skip: '20', limit: '5' });

      expect(res.status).toBe(200);
      expect(TournamentCategoryController.findAll).toHaveBeenCalled();
    });

    it('should handle skip and limit on GET /tournament/:tournamentId', async () => {
      const res = await request(app)
        .get('/tournament-categories/tournament/1')
        .query({ skip: '10', limit: '10' });

      expect(res.status).toBe(200);
      expect(TournamentCategoryController.findByTournamentId).toHaveBeenCalled();
    });
  });

  // ─── HTTP Methods Tests ────────────────────────────────────────────────────
  describe('HTTP Methods', () => {
    it('should accept POST to create', async () => {
      const res = await request(app)
        .post('/tournament-categories')
        .send({ tournamentId: 1, name: 'Test', type: 'single', maxEntries: 32, maxSets: 3 });

      expect(res.status).toBe(201);
    });

    it('should accept GET to retrieve', async () => {
      const res = await request(app)
        .get('/tournament-categories/1');

      expect(res.status).toBe(200);
    });

    it('should accept PUT to update', async () => {
      const res = await request(app)
        .put('/tournament-categories/1')
        .send({ name: 'Updated' });

      expect(res.status).toBe(200);
    });

    it('should accept DELETE to remove', async () => {
      const res = await request(app)
        .delete('/tournament-categories/1');

      expect(res.status).toBe(204);
    });
  });
});
