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

jest.mock('../../controllers/permission.controller');

import request from 'supertest';
import express, { Express } from 'express';
import permissionRoutes from '../../routes/permission.routes';
import permissionController from '../../controllers/permission.controller';

// ─── Setup ────────────────────────────────────────────────────────────────────
const createApp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use('/permissions', permissionRoutes);
  return app;
};

// ─── Factories ───────────────────────────────────────────────────────────────
const makePermission = (overrides: Record<string, any> = {}) => ({
  id: 1,
  name: 'users:create',
  description: 'Create users',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('Permission Routes', () => {
  let app: Express;

  beforeEach(() => {
    (permissionController.create as jest.Mock).mockClear();
    (permissionController.findAll as jest.Mock).mockClear();
    (permissionController.findById as jest.Mock).mockClear();
    (permissionController.update as jest.Mock).mockClear();
    (permissionController.delete as jest.Mock).mockClear();

    (permissionController.create as jest.Mock).mockImplementation((req, res) => {
      res.status(201).json(makePermission());
    });
    (permissionController.findAll as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json([makePermission(), makePermission({ id: 2, name: 'users:read' })]);
    });
    (permissionController.findById as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json(makePermission({ id: parseInt(req.params.id) }));
    });
    (permissionController.update as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json(makePermission({ id: parseInt(req.params.id) }));
    });
    (permissionController.delete as jest.Mock).mockImplementation((req, res) => {
      res.status(204).send();
    });

    app = createApp();
  });

  // ─── POST /permissions ────────────────────────────────────────────────────
  describe('POST /permissions', () => {
    it('should create permission and return 201', async () => {
      const permissionData = { name: 'users:create', description: 'Create users' };

      const res = await request(app)
        .post('/permissions')
        .send(permissionData);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(1);
    });

    it('should pass data to controller', async () => {
      const permissionData = { name: 'users:read', description: 'Read users' };

      await request(app)
        .post('/permissions')
        .send(permissionData);

      expect(permissionController.create).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      (permissionController.create as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({ message: 'Permission already exists' });
      });

      const res = await request(app)
        .post('/permissions')
        .send({ name: 'existing' });

      expect(res.status).toBe(400);
    });
  });

  // ─── GET /permissions ────────────────────────────────────────────────────
  describe('GET /permissions', () => {
    it('should get all permissions and return 200', async () => {
      const res = await request(app).get('/permissions');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should handle pagination', async () => {
      const res = await request(app)
        .get('/permissions')
        .query({ skip: '0', limit: '10' });

      expect(res.status).toBe(200);
      expect(permissionController.findAll).toHaveBeenCalled();
    });
  });

  // ─── GET /permissions/:id ─────────────────────────────────────────────────
  describe('GET /permissions/:id', () => {
    it('should get permission by ID and return 200', async () => {
      const res = await request(app).get('/permissions/1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
    });

    it('should handle permission not found', async () => {
      (permissionController.findById as jest.Mock).mockImplementation((req, res) => {
        res.status(404).json({ message: 'Permission not found' });
      });

      const res = await request(app).get('/permissions/999');

      expect(res.status).toBe(404);
    });
  });

  // ─── PUT /permissions/:id ─────────────────────────────────────────────────
  describe('PUT /permissions/:id', () => {
    it('should update permission and return 200', async () => {
      const updateData = { name: 'users:update', description: 'Update users' };

      const res = await request(app)
        .put('/permissions/1')
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
    });

    it('should pass update data to controller', async () => {
      await request(app)
        .put('/permissions/1')
        .send({ name: 'updated' });

      expect(permissionController.update).toHaveBeenCalled();
    });
  });

  // ─── DELETE /permissions/:id ──────────────────────────────────────────────
  describe('DELETE /permissions/:id', () => {
    it('should delete permission and return 204', async () => {
      const res = await request(app).delete('/permissions/1');

      expect(res.status).toBe(204);
    });

    it('should pass ID to controller', async () => {
      await request(app).delete('/permissions/1');

      expect(permissionController.delete).toHaveBeenCalled();
    });
  });

  // ─── HTTP Methods Tests ────────────────────────────────────────────────────
  describe('HTTP Methods', () => {
    it('should accept POST', async () => {
      const res = await request(app)
        .post('/permissions')
        .send({ name: 'test:permission', description: 'test' });

      expect(res.status).toBe(201);
    });

    it('should accept GET', async () => {
      const res = await request(app).get('/permissions/1');

      expect(res.status).toBe(200);
    });

    it('should accept PUT', async () => {
      const res = await request(app)
        .put('/permissions/1')
        .send({ name: 'updated' });

      expect(res.status).toBe(200);
    });

    it('should accept DELETE', async () => {
      const res = await request(app).delete('/permissions/1');

      expect(res.status).toBe(204);
    });
  });
});
