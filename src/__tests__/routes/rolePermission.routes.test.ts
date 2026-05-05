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

jest.mock('../../controllers/rolePermission.controller');

import request from 'supertest';
import express, { Express } from 'express';
import rolePermissionRoutes from '../../routes/rolePermission.routes';
import rolePermissionController from '../../controllers/rolePermission.controller';

// ─── Setup ────────────────────────────────────────────────────────────────────
const createApp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use('/role-permissions', rolePermissionRoutes);
  return app;
};

// ─── Factories ───────────────────────────────────────────────────────────────
const makeRolePermission = (overrides: Record<string, any> = {}) => ({
  id: 1,
  roleId: 1,
  permissionId: 1,
  createdAt: new Date(),
  ...overrides,
});

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('Role Permission Routes', () => {
  let app: Express;

  beforeEach(() => {
    (rolePermissionController.create as jest.Mock).mockClear();
    (rolePermissionController.findAll as jest.Mock).mockClear();
    (rolePermissionController.findByRoleId as jest.Mock).mockClear();
    (rolePermissionController.findByPermissionId as jest.Mock).mockClear();
    (rolePermissionController.hasPermission as jest.Mock).mockClear();
    (rolePermissionController.deleteByRoleIdAndPermissionId as jest.Mock).mockClear();

    (rolePermissionController.create as jest.Mock).mockImplementation((req, res) => {
      res.status(201).json(makeRolePermission());
    });
    (rolePermissionController.findAll as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json([makeRolePermission(), makeRolePermission({ id: 2 })]);
    });
    (rolePermissionController.findByRoleId as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json([makeRolePermission({ roleId: parseInt(req.params.roleId) })]);
    });
    (rolePermissionController.findByPermissionId as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json([makeRolePermission({ permissionId: parseInt(req.params.permissionId) })]);
    });
    (rolePermissionController.hasPermission as jest.Mock).mockImplementation((req, res) => {
      res.status(200).json({ has: true });
    });
    (rolePermissionController.deleteByRoleIdAndPermissionId as jest.Mock).mockImplementation((req, res) => {
      res.status(204).send();
    });

    app = createApp();
  });

  // ─── POST /role-permissions ───────────────────────────────────────────────
  describe('POST /role-permissions', () => {
    it('should assign permission to role and return 201', async () => {
      const data = { roleId: 1, permissionId: 1 };

      const res = await request(app)
        .post('/role-permissions')
        .send(data);

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(1);
    });

    it('should pass data to controller', async () => {
      await request(app)
        .post('/role-permissions')
        .send({ roleId: 1, permissionId: 2 });

      expect(rolePermissionController.create).toHaveBeenCalled();
    });

    it('should handle duplicate assignments', async () => {
      (rolePermissionController.create as jest.Mock).mockImplementation((req, res) => {
        res.status(400).json({ message: 'Permission already assigned to role' });
      });

      const res = await request(app)
        .post('/role-permissions')
        .send({ roleId: 1, permissionId: 1 });

      expect(res.status).toBe(400);
    });
  });

  // ─── GET /role-permissions ────────────────────────────────────────────────
  describe('GET /role-permissions', () => {
    it('should get all assignments and return 200', async () => {
      const res = await request(app).get('/role-permissions');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should handle pagination', async () => {
      const res = await request(app)
        .get('/role-permissions')
        .query({ page: '1', limit: '10' });

      expect(res.status).toBe(200);
      expect(rolePermissionController.findAll).toHaveBeenCalled();
    });
  });

  // ─── GET /role-permissions/role/:roleId ───────────────────────────────────
  describe('GET /role-permissions/role/:roleId', () => {
    it('should get permissions for role and return 200', async () => {
      const res = await request(app).get('/role-permissions/role/1');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should handle role not found', async () => {
      (rolePermissionController.findByRoleId as jest.Mock).mockImplementation((req, res) => {
        res.status(404).json({ message: 'Role not found' });
      });

      const res = await request(app).get('/role-permissions/role/999');

      expect(res.status).toBe(404);
    });
  });

  // ─── GET /role-permissions/permission/:permissionId ──────────────────────
  describe('GET /role-permissions/permission/:permissionId', () => {
    it('should get roles with permission and return 200', async () => {
      const res = await request(app).get('/role-permissions/permission/1');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should handle permission not found', async () => {
      (rolePermissionController.findByPermissionId as jest.Mock).mockImplementation((req, res) => {
        res.status(404).json({ message: 'Permission not found' });
      });

      const res = await request(app).get('/role-permissions/permission/999');

      expect(res.status).toBe(404);
    });
  });

  // ─── GET /role-permissions/check ──────────────────────────────────────────
  describe('GET /role-permissions/check', () => {
    it('should check if role has permission and return 200', async () => {
      const res = await request(app)
        .get('/role-permissions/check')
        .query({ roleId: '1', permissionId: '1' });

      expect(res.status).toBe(200);
      expect(res.body.has).toBeDefined();
    });
  });

  // ─── DELETE /role-permissions/:roleId/:permissionId ──────────────────────
  describe('DELETE /role-permissions/:roleId/:permissionId', () => {
    it('should remove permission from role and return 204', async () => {
      const res = await request(app).delete('/role-permissions/1/1');

      expect(res.status).toBe(204);
    });

    it('should pass IDs to controller', async () => {
      await request(app).delete('/role-permissions/1/2');

      expect(rolePermissionController.deleteByRoleIdAndPermissionId).toHaveBeenCalled();
    });

    it('should handle not found', async () => {
      (rolePermissionController.deleteByRoleIdAndPermissionId as jest.Mock).mockImplementation((req, res) => {
        res.status(404).json({ message: 'Assignment not found' });
      });

      const res = await request(app).delete('/role-permissions/999/999');

      expect(res.status).toBe(404);
    });
  });

  // ─── HTTP Methods Tests ────────────────────────────────────────────────────
  describe('HTTP Methods', () => {
    it('should accept POST', async () => {
      const res = await request(app)
        .post('/role-permissions')
        .send({ roleId: 1, permissionId: 1 });

      expect(res.status).toBe(201);
    });

    it('should accept GET', async () => {
      const res = await request(app).get('/role-permissions/role/1');

      expect(res.status).toBe(200);
    });

    it('should accept DELETE', async () => {
      const res = await request(app).delete('/role-permissions/1/1');

      expect(res.status).toBe(204);
    });
  });
});
