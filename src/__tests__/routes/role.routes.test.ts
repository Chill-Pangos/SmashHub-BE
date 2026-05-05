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

jest.mock('../../controllers/role.controller');

import request from 'supertest';
import express, { Express } from 'express';
import roleRoutes from '../../routes/role.routes';
import roleController from '../../controllers/role.controller';

// ─── Setup ────────────────────────────────────────────────────────────────────
const createApp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use('/roles', roleRoutes);
  return app;
};

// ─── Factories ───────────────────────────────────────────────────────────────
const makeRole = (overrides: Record<string, any> = {}) => ({
  id: 1,
  name: 'admin',
  description: 'Administrator role',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('Role Routes', () => {
  let app: Express;

  beforeEach(() => {
    (roleController.create as jest.Mock).mockClear();
    (roleController.findAll as jest.Mock).mockClear();
    (roleController.findById as jest.Mock).mockClear();
    (roleController.update as jest.Mock).mockClear();
    (roleController.delete as jest.Mock).mockClear();
    (roleController.findByName as jest.Mock).mockClear();

    (roleController.create as jest.Mock).mockImplementation((req, res) => {
      res.status(201).json(makeRole());
    });
    (roleController.findAll as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json([makeRole(), makeRole({ id: 2, name: 'user' })]);
    });
    (roleController.findById as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json(makeRole({ id: parseInt(req.params.id) }));
    });
    (roleController.update as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json(makeRole({ id: parseInt(req.params.id) }));
    });
    (roleController.delete as jest.Mock).mockImplementation((req, res) => {
      res.status(204).send();
    });
    (roleController.findByName as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json(makeRole({ name: req.params.name }));
    });

    app = createApp();
  });

  // ─── POST /roles ──────────────────────────────────────────────────────────
  describe('POST /roles', () => {
    it('should create role and return 201', async () => {
      const roleData = { name: 'admin', description: 'Administrator role' };

      const res = await request(app)
        .post('/roles')
        .send(roleData);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(1);
      expect(res.body.name).toBeDefined();
    });

    it('should pass role data to controller', async () => {
      const roleData = { name: 'moderator', description: 'Moderator role' };

      await request(app)
        .post('/roles')
        .send(roleData);

      expect(roleController.create).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      (roleController.create as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({ message: 'Role name already exists' });
      });

      const res = await request(app)
        .post('/roles')
        .send({ name: 'existing' });

      expect(res.status).toBe(400);
    });
  });

  // ─── GET /roles ────────────────────────────────────────────────────────────
  describe('GET /roles', () => {
    it('should get all roles and return 200', async () => {
      const res = await request(app).get('/roles');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should handle pagination', async () => {
      const res = await request(app)
        .get('/roles')
        .query({ skip: '0', limit: '10' });

      expect(res.status).toBe(200);
      expect(roleController.findAll).toHaveBeenCalled();
    });
  });

  // ─── GET /roles/:id ───────────────────────────────────────────────────────
  describe('GET /roles/:id', () => {
    it('should get role by ID and return 200', async () => {
      const res = await request(app).get('/roles/1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
    });

    it('should handle role not found', async () => {
      (roleController.findById as jest.Mock).mockImplementation((req, res) => {
        res.status(404).json({ message: 'Role not found' });
      });

      const res = await request(app).get('/roles/999');

      expect(res.status).toBe(404);
    });
  });

  // ─── PUT /roles/:id ───────────────────────────────────────────────────────
  describe('PUT /roles/:id', () => {
    it('should update role and return 200', async () => {
      const updateData = { name: 'updated_admin', description: 'Updated description' };

      const res = await request(app)
        .put('/roles/1')
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
    });

    it('should pass update data to controller', async () => {
      await request(app)
        .put('/roles/1')
        .send({ name: 'updated' });

      expect(roleController.update).toHaveBeenCalled();
    });

    it('should handle role not found', async () => {
      (roleController.update as jest.Mock).mockImplementation((req, res) => {
        res.status(404).json({ message: 'Role not found' });
      });

      const res = await request(app)
        .put('/roles/999')
        .send({ name: 'new_name' });

      expect(res.status).toBe(404);
    });
  });

  // ─── DELETE /roles/:id ────────────────────────────────────────────────────
  describe('DELETE /roles/:id', () => {
    it('should delete role and return 204', async () => {
      const res = await request(app).delete('/roles/1');

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });

    it('should pass ID to controller', async () => {
      await request(app).delete('/roles/5');

      expect(roleController.delete).toHaveBeenCalled();
    });

    it('should handle role not found', async () => {
      (roleController.delete as jest.Mock).mockImplementation((req, res) => {
        res.status(404).json({ message: 'Role not found' });
      });

      const res = await request(app).delete('/roles/999');

      expect(res.status).toBe(404);
    });
  });

  // ─── GET /roles/name/:name ────────────────────────────────────────────────
  describe('GET /roles/name/:name', () => {
    it('should get role by name and return 200', async () => {
      const res = await request(app).get('/roles/name/admin');

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('admin');
    });

    it('should handle role not found', async () => {
      (roleController.findByName as jest.Mock).mockImplementation((req, res) => {
        res.status(404).json({ message: 'Role not found' });
      });

      const res = await request(app).get('/roles/name/nonexistent');

      expect(res.status).toBe(404);
    });
  });

  // ─── Content-Type Tests ───────────────────────────────────────────────────
  describe('Content Type Handling', () => {
    it('should handle JSON request body', async () => {
      const res = await request(app)
        .post('/roles')
        .set('Content-Type', 'application/json')
        .send({ name: 'test', description: 'test role' });

      expect(res.status).toBe(201);
    });

    it('should return JSON response', async () => {
      const res = await request(app).get('/roles/1');

      expect(res.type).toMatch(/json/);
    });
  });

  // ─── HTTP Methods Tests ────────────────────────────────────────────────────
  describe('HTTP Methods', () => {
    it('should accept POST to create', async () => {
      const res = await request(app)
        .post('/roles')
        .send({ name: 'test', description: 'test' });

      expect(res.status).toBe(201);
    });

    it('should accept GET to retrieve', async () => {
      const res = await request(app).get('/roles/1');

      expect(res.status).toBe(200);
    });

    it('should accept PUT to update', async () => {
      const res = await request(app)
        .put('/roles/1')
        .send({ name: 'updated' });

      expect(res.status).toBe(200);
    });

    it('should accept DELETE to remove', async () => {
      const res = await request(app).delete('/roles/1');

      expect(res.status).toBe(204);
    });
  });
});
