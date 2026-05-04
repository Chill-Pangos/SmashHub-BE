// ─── Env Setup ───────────────────────────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USERNAME = 'root';
process.env.DB_PASSWORD = 'password';
process.env.DB_DATABASE = 'test_db';

jest.mock('../../services/rolePermission.service');

import { Request, Response, NextFunction } from 'express';
import { RolePermissionController } from '../../controllers/rolePermission.controller';
import rolePermissionService from '../../services/rolePermission.service';
import { ConflictError, NotFoundError } from '../../utils/errors';

// ─── Factories ───────────────────────────────────────────────────────────────
const makeRolePermission = (overrides: Record<string, any> = {}) => ({
  roleId: 1,
  permissionId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  Role: { id: 1, name: 'admin' },
  Permission: { id: 1, name: 'match:read' },
  ...overrides,
});

const makeResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
});

const makeRequest = (overrides: Record<string, any> = {}) => ({
  body: {},
  query: {},
  params: {},
  ...overrides,
});

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('RolePermissionController', () => {
  let controller: RolePermissionController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new RolePermissionController();
    mockNext = jest.fn();
    mockRes = makeResponse();
  });

  // ─── CREATE ──────────────────────────────────────────────────────────────
  describe('create', () => {
    const createDto = { roleId: 1, permissionId: 1 };

    it('should create role-permission assignment and return 201 status', async () => {
      const mockData = makeRolePermission();
      mockReq = makeRequest({ body: createDto });
      (rolePermissionService.create as jest.Mock).mockResolvedValue(mockData);

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockData);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass request body to service', async () => {
      mockReq = makeRequest({ body: createDto });
      (rolePermissionService.create as jest.Mock).mockResolvedValue(makeRolePermission());

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(rolePermissionService.create).toHaveBeenCalledWith(createDto);
    });

    it('should call next with error when role not found', async () => {
      const error = new NotFoundError('Role not found', 'ROLE_NOT_FOUND');
      mockReq = makeRequest({ body: createDto });
      (rolePermissionService.create as jest.Mock).mockRejectedValue(error);

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next with error when permission not found', async () => {
      const error = new NotFoundError('Permission not found', 'PERMISSION_NOT_FOUND');
      mockReq = makeRequest({ body: createDto });
      (rolePermissionService.create as jest.Mock).mockRejectedValue(error);

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error when assignment already exists', async () => {
      const error = new ConflictError('Permission already assigned to role', 'ROLE_PERMISSION_ALREADY_EXISTS');
      mockReq = makeRequest({ body: createDto });
      (rolePermissionService.create as jest.Mock).mockRejectedValue(error);

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── FIND ALL ─────────────────────────────────────────────────────────────
  describe('findAll', () => {
    const mockRolePermissions = [
      makeRolePermission({ roleId: 1, permissionId: 1 }),
      makeRolePermission({ roleId: 1, permissionId: 2, Permission: { id: 2, name: 'match:write' } }),
    ];
    const pagination = {
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };

    it('should find all role-permissions with default pagination', async () => {
      mockReq = makeRequest({ query: {} });
      (rolePermissionService.findAll as jest.Mock).mockResolvedValue({
        rolePermissions: mockRolePermissions,
        pagination,
      });

      await controller.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(rolePermissionService.findAll).toHaveBeenCalledWith(1, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        rolePermissions: mockRolePermissions,
        pagination,
      });
    });

    it('should parse page and limit from query parameters', async () => {
      mockReq = makeRequest({ query: { page: '2', limit: '5' } });
      (rolePermissionService.findAll as jest.Mock).mockResolvedValue({
        rolePermissions: [mockRolePermissions[0]],
        pagination: { ...pagination, page: 2, limit: 5 },
      });

      await controller.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(rolePermissionService.findAll).toHaveBeenCalledWith(2, 5);
    });

    it('should use default values for missing parameters', async () => {
      mockReq = makeRequest({ query: {} });
      (rolePermissionService.findAll as jest.Mock).mockResolvedValue({
        rolePermissions: [],
        pagination,
      });

      await controller.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(rolePermissionService.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('should call next with error on service failure', async () => {
      const error = new Error('Database error');
      mockReq = makeRequest({ query: {} });
      (rolePermissionService.findAll as jest.Mock).mockRejectedValue(error);

      await controller.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── FIND BY ROLE ID ──────────────────────────────────────────────────────
  describe('findByRoleId', () => {
    const mockRolePermissions = [
      makeRolePermission({ roleId: 1, permissionId: 1 }),
    ];
    const pagination = {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };

    it('should find permissions for a role and return 200 status', async () => {
      mockReq = makeRequest({ params: { roleId: '1' }, query: {} });
      (rolePermissionService.findByRoleId as jest.Mock).mockResolvedValue({
        rolePermissions: mockRolePermissions,
        pagination,
      });

      await controller.findByRoleId(mockReq as Request, mockRes as Response, mockNext);

      expect(rolePermissionService.findByRoleId).toHaveBeenCalledWith(1, 1, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        rolePermissions: mockRolePermissions,
        pagination,
      });
    });

    it('should parse roleId and pagination from parameters', async () => {
      mockReq = makeRequest({ params: { roleId: '5' }, query: { page: '2', limit: '20' } });
      (rolePermissionService.findByRoleId as jest.Mock).mockResolvedValue({
        rolePermissions: [],
        pagination,
      });

      await controller.findByRoleId(mockReq as Request, mockRes as Response, mockNext);

      expect(rolePermissionService.findByRoleId).toHaveBeenCalledWith(5, 2, 20);
    });

    it('should use default pagination values', async () => {
      mockReq = makeRequest({ params: { roleId: '1' }, query: {} });
      (rolePermissionService.findByRoleId as jest.Mock).mockResolvedValue({
        rolePermissions: [],
        pagination,
      });

      await controller.findByRoleId(mockReq as Request, mockRes as Response, mockNext);

      expect(rolePermissionService.findByRoleId).toHaveBeenCalledWith(1, 1, 10);
    });

    it('should call next with error when role not found', async () => {
      const error = new NotFoundError('Role not found', 'ROLE_NOT_FOUND');
      mockReq = makeRequest({ params: { roleId: '999' }, query: {} });
      (rolePermissionService.findByRoleId as jest.Mock).mockRejectedValue(error);

      await controller.findByRoleId(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── FIND BY PERMISSION ID ────────────────────────────────────────────────
  describe('findByPermissionId', () => {
    const mockRolePermissions = [
      makeRolePermission({ roleId: 1, permissionId: 1 }),
    ];
    const pagination = {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };

    it('should find roles that have a permission and return 200 status', async () => {
      mockReq = makeRequest({ params: { permissionId: '1' }, query: {} });
      (rolePermissionService.findByPermissionId as jest.Mock).mockResolvedValue({
        rolePermissions: mockRolePermissions,
        pagination,
      });

      await controller.findByPermissionId(mockReq as Request, mockRes as Response, mockNext);

      expect(rolePermissionService.findByPermissionId).toHaveBeenCalledWith(1, 1, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        rolePermissions: mockRolePermissions,
        pagination,
      });
    });

    it('should parse permissionId and pagination from parameters', async () => {
      mockReq = makeRequest({ params: { permissionId: '10' }, query: { page: '3', limit: '15' } });
      (rolePermissionService.findByPermissionId as jest.Mock).mockResolvedValue({
        rolePermissions: [],
        pagination,
      });

      await controller.findByPermissionId(mockReq as Request, mockRes as Response, mockNext);

      expect(rolePermissionService.findByPermissionId).toHaveBeenCalledWith(10, 3, 15);
    });

    it('should call next with error when permission not found', async () => {
      const error = new NotFoundError('Permission not found', 'PERMISSION_NOT_FOUND');
      mockReq = makeRequest({ params: { permissionId: '999' }, query: {} });
      (rolePermissionService.findByPermissionId as jest.Mock).mockRejectedValue(error);

      await controller.findByPermissionId(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── HAS PERMISSION ───────────────────────────────────────────────────────
  describe('hasPermission', () => {
    it('should check if role has permission and return result', async () => {
      mockReq = makeRequest({ query: { roleId: '1', permissionId: '1' } });
      (rolePermissionService.hasPermission as jest.Mock).mockResolvedValue(true);

      await controller.hasPermission(mockReq as Request, mockRes as Response, mockNext);

      expect(rolePermissionService.hasPermission).toHaveBeenCalledWith(1, 1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ hasPermission: true });
    });

    it('should return false when role does not have permission', async () => {
      mockReq = makeRequest({ query: { roleId: '1', permissionId: '2' } });
      (rolePermissionService.hasPermission as jest.Mock).mockResolvedValue(false);

      await controller.hasPermission(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ hasPermission: false });
    });

    it('should parse roleId and permissionId from query parameters', async () => {
      mockReq = makeRequest({ query: { roleId: '5', permissionId: '10' } });
      (rolePermissionService.hasPermission as jest.Mock).mockResolvedValue(true);

      await controller.hasPermission(mockReq as Request, mockRes as Response, mockNext);

      expect(rolePermissionService.hasPermission).toHaveBeenCalledWith(5, 10);
    });

    it('should call next with error on service failure', async () => {
      const error = new Error('Database error');
      mockReq = makeRequest({ query: { roleId: '1', permissionId: '1' } });
      (rolePermissionService.hasPermission as jest.Mock).mockRejectedValue(error);

      await controller.hasPermission(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── DELETE BY ROLE ID AND PERMISSION ID ──────────────────────────────────
  describe('deleteByRoleIdAndPermissionId', () => {
    it('should delete role-permission assignment and return 204 status', async () => {
      mockReq = makeRequest({ params: { roleId: '1', permissionId: '1' } });
      (rolePermissionService.deleteByRoleIdAndPermissionId as jest.Mock).mockResolvedValue(undefined);

      await controller.deleteByRoleIdAndPermissionId(mockReq as Request, mockRes as Response, mockNext);

      expect(rolePermissionService.deleteByRoleIdAndPermissionId).toHaveBeenCalledWith(1, 1);
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should parse roleId and permissionId from parameters', async () => {
      mockReq = makeRequest({ params: { roleId: '5', permissionId: '10' } });
      (rolePermissionService.deleteByRoleIdAndPermissionId as jest.Mock).mockResolvedValue(undefined);

      await controller.deleteByRoleIdAndPermissionId(mockReq as Request, mockRes as Response, mockNext);

      expect(rolePermissionService.deleteByRoleIdAndPermissionId).toHaveBeenCalledWith(5, 10);
    });

    it('should call next with error when assignment not found', async () => {
      const error = new NotFoundError('Role-permission assignment not found', 'ROLE_PERMISSION_NOT_FOUND');
      mockReq = makeRequest({ params: { roleId: '1', permissionId: '999' } });
      (rolePermissionService.deleteByRoleIdAndPermissionId as jest.Mock).mockRejectedValue(error);

      await controller.deleteByRoleIdAndPermissionId(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should not send response when error occurs', async () => {
      const error = new Error('Database error');
      mockReq = makeRequest({ params: { roleId: '1', permissionId: '1' } });
      (rolePermissionService.deleteByRoleIdAndPermissionId as jest.Mock).mockRejectedValue(error);

      await controller.deleteByRoleIdAndPermissionId(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.send).not.toHaveBeenCalled();
    });
  });
});
