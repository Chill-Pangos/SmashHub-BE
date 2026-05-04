// ─── Env Setup ───────────────────────────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USERNAME = 'root';
process.env.DB_PASSWORD = 'password';
process.env.DB_DATABASE = 'test_db';

jest.mock('../../services/permission.service');

import { Request, Response, NextFunction } from 'express';
import { PermissionController } from '../../controllers/permission.controller';
import permissionService from '../../services/permission.service';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/errors';

// ─── Factories ───────────────────────────────────────────────────────────────
const makePermission = (overrides: Record<string, any> = {}) => ({
  id: 1,
  name: 'match:read',
  createdAt: new Date(),
  updatedAt: new Date(),
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
describe('PermissionController', () => {
  let controller: PermissionController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PermissionController();
    mockNext = jest.fn();
    mockRes = makeResponse();
  });

  // ─── CREATE ──────────────────────────────────────────────────────────────
  describe('create', () => {
    const createDto = { name: 'match:read' };

    it('should create permission and return 201 status', async () => {
      const mockPermission = makePermission();
      mockReq = makeRequest({ body: createDto });
      (permissionService.create as jest.Mock).mockResolvedValue(mockPermission);

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockPermission);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass request body to service', async () => {
      mockReq = makeRequest({ body: createDto });
      (permissionService.create as jest.Mock).mockResolvedValue(makePermission());

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(permissionService.create).toHaveBeenCalledWith(createDto);
    });

    it('should call next with error when name format invalid', async () => {
      const error = new BadRequestError(
        "Permission name must follow format 'resource:action'",
        'PERMISSION_FORMAT_INVALID'
      );
      mockReq = makeRequest({ body: { name: 'invalid_format' } });
      (permissionService.create as jest.Mock).mockRejectedValue(error);

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next with error when name already taken', async () => {
      const error = new ConflictError('Permission already exists', 'PERMISSION_ALREADY_EXISTS');
      mockReq = makeRequest({ body: createDto });
      (permissionService.create as jest.Mock).mockRejectedValue(error);

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error when name is empty', async () => {
      const error = new BadRequestError('Permission name is required', 'PERMISSION_NAME_REQUIRED');
      mockReq = makeRequest({ body: { name: '' } });
      (permissionService.create as jest.Mock).mockRejectedValue(error);

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── FIND ALL ─────────────────────────────────────────────────────────────
  describe('findAll', () => {
    const mockPermissions = [
      makePermission({ id: 1, name: 'match:read' }),
      makePermission({ id: 2, name: 'match:write' }),
    ];
    const pagination = {
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };

    it('should find all permissions with default pagination', async () => {
      mockReq = makeRequest({ query: {} });
      (permissionService.findAll as jest.Mock).mockResolvedValue({
        permissions: mockPermissions,
        pagination,
      });

      await controller.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(permissionService.findAll).toHaveBeenCalledWith(1, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        permissions: mockPermissions,
        pagination,
      });
    });

    it('should parse page and limit from query parameters', async () => {
      mockReq = makeRequest({ query: { page: '3', limit: '20' } });
      (permissionService.findAll as jest.Mock).mockResolvedValue({
        permissions: [mockPermissions[0]],
        pagination: { ...pagination, page: 3, limit: 20 },
      });

      await controller.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(permissionService.findAll).toHaveBeenCalledWith(3, 20);
    });

    it('should use default values for missing parameters', async () => {
      mockReq = makeRequest({ query: {} });
      (permissionService.findAll as jest.Mock).mockResolvedValue({
        permissions: [],
        pagination,
      });

      await controller.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(permissionService.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('should call next with error on service failure', async () => {
      const error = new Error('Database error');
      mockReq = makeRequest({ query: {} });
      (permissionService.findAll as jest.Mock).mockRejectedValue(error);

      await controller.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── FIND BY ID ───────────────────────────────────────────────────────────
  describe('findById', () => {
    it('should find permission by ID and return 200 status', async () => {
      const mockPermission = makePermission({ id: 5 });
      mockReq = makeRequest({ params: { id: '5' } });
      (permissionService.findById as jest.Mock).mockResolvedValue(mockPermission);

      await controller.findById(mockReq as Request, mockRes as Response, mockNext);

      expect(permissionService.findById).toHaveBeenCalledWith(5);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockPermission);
    });

    it('should parse ID from string to number', async () => {
      mockReq = makeRequest({ params: { id: '123' } });
      (permissionService.findById as jest.Mock).mockResolvedValue(makePermission({ id: 123 }));

      await controller.findById(mockReq as Request, mockRes as Response, mockNext);

      expect(permissionService.findById).toHaveBeenCalledWith(123);
    });

    it('should call next with error when permission not found', async () => {
      const error = new NotFoundError('Permission not found', 'PERMISSION_NOT_FOUND');
      mockReq = makeRequest({ params: { id: '999' } });
      (permissionService.findById as jest.Mock).mockRejectedValue(error);

      await controller.findById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── FIND BY NAME ─────────────────────────────────────────────────────────
  describe('findByName', () => {
    it('should find permission by name and return 200 status', async () => {
      const mockPermission = makePermission({ name: 'match:read' });
      mockReq = makeRequest({ params: { name: 'match:read' } });
      (permissionService.findByName as jest.Mock).mockResolvedValue(mockPermission);

      await controller.findByName(mockReq as Request, mockRes as Response, mockNext);

      expect(permissionService.findByName).toHaveBeenCalledWith('match:read');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockPermission);
    });

    it('should call next with error when permission not found', async () => {
      const error = new NotFoundError('Permission not found', 'PERMISSION_NOT_FOUND');
      mockReq = makeRequest({ params: { name: 'nonexistent:action' } });
      (permissionService.findByName as jest.Mock).mockRejectedValue(error);

      await controller.findByName(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  describe('update', () => {
    const updateDto = { name: 'match:write' };

    it('should update permission and return 200 status', async () => {
      const mockPermission = makePermission(updateDto);
      mockReq = makeRequest({ params: { id: '1' }, body: updateDto });
      (permissionService.update as jest.Mock).mockResolvedValue(mockPermission);

      await controller.update(mockReq as Request, mockRes as Response, mockNext);

      expect(permissionService.update).toHaveBeenCalledWith(1, updateDto);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockPermission);
    });

    it('should pass both ID and body to service', async () => {
      mockReq = makeRequest({ params: { id: '5' }, body: updateDto });
      (permissionService.update as jest.Mock).mockResolvedValue(makePermission());

      await controller.update(mockReq as Request, mockRes as Response, mockNext);

      expect(permissionService.update).toHaveBeenCalledWith(5, updateDto);
    });

    it('should call next with error when permission not found', async () => {
      const error = new NotFoundError('Permission not found', 'PERMISSION_NOT_FOUND');
      mockReq = makeRequest({ params: { id: '999' }, body: updateDto });
      (permissionService.update as jest.Mock).mockRejectedValue(error);

      await controller.update(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error when format invalid', async () => {
      const error = new BadRequestError(
        "Permission name must follow format 'resource:action'",
        'PERMISSION_FORMAT_INVALID'
      );
      mockReq = makeRequest({ params: { id: '1' }, body: { name: 'invalid' } });
      (permissionService.update as jest.Mock).mockRejectedValue(error);

      await controller.update(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error when new name already taken', async () => {
      const error = new ConflictError('Permission already exists', 'PERMISSION_ALREADY_EXISTS');
      mockReq = makeRequest({ params: { id: '1' }, body: updateDto });
      (permissionService.update as jest.Mock).mockRejectedValue(error);

      await controller.update(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('should delete permission and return 204 status', async () => {
      mockReq = makeRequest({ params: { id: '1' } });
      (permissionService.delete as jest.Mock).mockResolvedValue(undefined);

      await controller.delete(mockReq as Request, mockRes as Response, mockNext);

      expect(permissionService.delete).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should parse ID from string to number', async () => {
      mockReq = makeRequest({ params: { id: '42' } });
      (permissionService.delete as jest.Mock).mockResolvedValue(undefined);

      await controller.delete(mockReq as Request, mockRes as Response, mockNext);

      expect(permissionService.delete).toHaveBeenCalledWith(42);
    });

    it('should call next with error when permission not found', async () => {
      const error = new NotFoundError('Permission not found', 'PERMISSION_NOT_FOUND');
      mockReq = makeRequest({ params: { id: '999' } });
      (permissionService.delete as jest.Mock).mockRejectedValue(error);

      await controller.delete(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
