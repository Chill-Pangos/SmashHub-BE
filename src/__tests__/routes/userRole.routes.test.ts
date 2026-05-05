// ─── Env Setup ───────────────────────────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_very_long_string_for_jwt_secret_minimum_32_chars';

// ─── Mock middleware & controller ─────────────────────────────────────────────
jest.mock('../../middlewares/auth.middleware', () => ({
  authenticate: jest.fn((_req: any, res: any, next: any) => next()),
}));

jest.mock('../../middlewares/permission.middleware', () => ({
  checkRole: jest.fn(() => (_req: any, res: any, next: any) => next()),
}));

jest.mock('../../controllers/userRole.controller');

import request from 'supertest';
import express, { Express } from 'express';
import userRoleRoutes from '../../routes/userRole.routes';
import userRoleController from '../../controllers/userRole.controller';

// ─── Setup ────────────────────────────────────────────────────────────────────
const createApp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use('/user-roles', userRoleRoutes);
  return app;
};

// ─── Factories ───────────────────────────────────────────────────────────────
const makeUserRole = (overrides: Record<string, any> = {}) => ({
  id: 1,
  userId: 1,
  roleId: 1,
  createdAt: new Date(),
  ...overrides,
});

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('User Role Routes', () => {
  let app: Express;

  beforeEach(() => {
    (userRoleController.create as jest.Mock).mockClear();
    (userRoleController.findAll as jest.Mock).mockClear();
    (userRoleController.findByUserId as jest.Mock).mockClear();
    (userRoleController.findByRoleId as jest.Mock).mockClear();
    (userRoleController.hasRole as jest.Mock).mockClear();
    (userRoleController.deleteByUserIdAndRoleId as jest.Mock).mockClear();

    (userRoleController.create as jest.Mock).mockImplementation((req, res) => {
      res.status(201).json(makeUserRole());
    });
    (userRoleController.findAll as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json([makeUserRole(), makeUserRole({ id: 2 })]);
    });
    (userRoleController.findByUserId as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json([makeUserRole({ userId: parseInt(req.params.userId) })]);
    });
    (userRoleController.findByRoleId as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json([makeUserRole({ roleId: parseInt(req.params.roleId) })]);
    });
    (userRoleController.hasRole as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ has: true });
    });
    (userRoleController.deleteByUserIdAndRoleId as jest.Mock).mockImplementation((req, res) => {
      res.status(204).send();
    });

    app = createApp();
  });

  // ─── POST /user-roles ─────────────────────────────────────────────────────
  describe('POST /user-roles', () => {
    it('should assign role to user and return 201', async () => {
      const data = { userId: 1, roleId: 1 };

      const res = await request(app)
        .post('/user-roles')
        .send(data);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(1);
    });

    it('should pass data to controller', async () => {
      await request(app)
        .post('/user-roles')
        .send({ userId: 1, roleId: 2 });

      expect(userRoleController.create).toHaveBeenCalled();
    });

    it('should handle duplicate role assignments', async () => {
      (userRoleController.create as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({ message: 'Role already assigned to user' });
      });

      const res = await request(app)
        .post('/user-roles')
        .send({ userId: 1, roleId: 1 });

      expect(res.status).toBe(400);
    });
  });

  // ─── GET /user-roles ──────────────────────────────────────────────────────
  describe('GET /user-roles', () => {
    it('should get all user-role assignments and return 200', async () => {
      const res = await request(app).get('/user-roles');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should handle pagination', async () => {
      const res = await request(app)
        .get('/user-roles')
        .query({ page: '1', limit: '10' });

      expect(res.status).toBe(200);
      expect(userRoleController.findAll).toHaveBeenCalled();
    });
  });

  // ─── GET /user-roles/user/:userId ─────────────────────────────────────────
  describe('GET /user-roles/user/:userId', () => {
    it('should get roles for user and return 200', async () => {
      const res = await request(app).get('/user-roles/user/1');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should handle user not found', async () => {
      (userRoleController.findByUserId as jest.Mock).mockImplementation((req, res) => {
        res.status(404).json({ message: 'User not found' });
      });

      const res = await request(app).get('/user-roles/user/999');

      expect(res.status).toBe(404);
    });

    it('should return empty array for user with no roles', async () => {
      (userRoleController.findByUserId as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json([]);
      });

      const res = await request(app).get('/user-roles/user/1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // ─── GET /user-roles/role/:roleId ─────────────────────────────────────────
  describe('GET /user-roles/role/:roleId', () => {
    it('should get users with role and return 200', async () => {
      const res = await request(app).get('/user-roles/role/1');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should handle role not found', async () => {
      (userRoleController.findByRoleId as jest.Mock).mockImplementation((req, res) => {
        res.status(404).json({ message: 'Role not found' });
      });

      const res = await request(app).get('/user-roles/role/999');

      expect(res.status).toBe(404);
    });

    it('should return empty array for role with no users', async () => {
      (userRoleController.findByRoleId as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json([]);
      });

      const res = await request(app).get('/user-roles/role/1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // ─── GET /user-roles/check ────────────────────────────────────────────────
  describe('GET /user-roles/check', () => {
    it('should check if user has role and return 200', async () => {
      const res = await request(app)
        .get('/user-roles/check')
        .query({ userId: '1', roleId: '1' });

      expect(res.status).toBe(200);
      expect(res.body.has).toBeDefined();
    });

    it('should return false when user does not have role', async () => {
      (userRoleController.hasRole as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ has: false });
      });

      const res = await request(app)
        .get('/user-roles/check')
        .query({ userId: '1', roleId: '999' });

      expect(res.status).toBe(200);
      expect(res.body.has).toBe(false);
    });
  });

  // ─── DELETE /user-roles/:userId/:roleId ────────────────────────────────────
  describe('DELETE /user-roles/:userId/:roleId', () => {
    it('should remove role from user and return 204', async () => {
      const res = await request(app).delete('/user-roles/1/1');

      expect(res.status).toBe(204);
    });

    it('should pass IDs to controller', async () => {
      await request(app).delete('/user-roles/1/2');

      expect(userRoleController.deleteByUserIdAndRoleId).toHaveBeenCalled();
    });

    it('should handle not found', async () => {
      (userRoleController.deleteByUserIdAndRoleId as jest.Mock).mockImplementation((req, res) => {
        res.status(404).json({ message: 'User-role assignment not found' });
      });

      const res = await request(app).delete('/user-roles/999/999');

      expect(res.status).toBe(404);
    });
  });

  // ─── HTTP Methods Tests ────────────────────────────────────────────────────
  describe('HTTP Methods', () => {
    it('should accept POST', async () => {
      const res = await request(app)
        .post('/user-roles')
        .send({ userId: 1, roleId: 1 });

      expect(res.status).toBe(201);
    });

    it('should accept GET', async () => {
      const res = await request(app).get('/user-roles/user/1');

      expect(res.status).toBe(200);
    });

    it('should accept DELETE', async () => {
      const res = await request(app).delete('/user-roles/1/1');

      expect(res.status).toBe(204);
    });
  });

  // ─── Content-Type Tests ────────────────────────────────────────────────────
  describe('Content Type Handling', () => {
    it('should handle JSON request body', async () => {
      const res = await request(app)
        .post('/user-roles')
        .set('Content-Type', 'application/json')
        .send({ userId: 1, roleId: 1 });

      expect(res.status).toBe(201);
    });

    it('should return JSON response', async () => {
      const res = await request(app).get('/user-roles/user/1');

      expect(res.type).toMatch(/json/);
    });
  });
});
