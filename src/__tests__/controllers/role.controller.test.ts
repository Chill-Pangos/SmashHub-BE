// ─── Env Setup ───────────────────────────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USERNAME = 'root';
process.env.DB_PASSWORD = 'password';
process.env.DB_DATABASE = 'test_db';

jest.mock('../../services/role.service');

import { Request, Response, NextFunction } from 'express';
import { RoleController } from '../../controllers/role.controller';
import roleService from '../../services/role.service';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/errors';

// ─── Factories ───────────────────────────────────────────────────────────────
const makeRole = (overrides: Record<string, any> = {}) => ({
  id: 1,
  name: 'admin',
  description: 'Administrator role',
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
describe('RoleController', () => {
  let controller: RoleController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new RoleController();
    mockNext = jest.fn();
    mockRes = makeResponse();
  });

  // ─── CREATE ──────────────────────────────────────────────────────────────
  describe('create', () => {
    const createDto = { name: 'admin', description: 'Admin role' };

    it('should create role and return 201 status', async () => {
      const mockRole = makeRole();
      mockReq = makeRequest({ body: createDto });
      (roleService.create as jest.Mock).mockResolvedValue(mockRole);

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockRole);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass request body to service', async () => {
      mockReq = makeRequest({ body: createDto });
      (roleService.create as jest.Mock).mockResolvedValue(makeRole());

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(roleService.create).toHaveBeenCalledWith(createDto);
    });

    it('should call next with error when name already taken', async () => {
      const error = new ConflictError('Role name already exists', 'ROLE_ALREADY_EXISTS');
      mockReq = makeRequest({ body: createDto });
      (roleService.create as jest.Mock).mockRejectedValue(error);

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next with error when name is empty', async () => {
      const error = new BadRequestError('Role name is required', 'ROLE_NAME_REQUIRED');
      mockReq = makeRequest({ body: { name: '', description: 'Test' } });
      (roleService.create as jest.Mock).mockRejectedValue(error);

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── FIND ALL ─────────────────────────────────────────────────────────────
  describe('findAll', () => {
    const mockRoles = [makeRole({ id: 1 }), makeRole({ id: 2, name: 'user' })];
    const pagination = {
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };

    it('should find all roles with default pagination', async () => {
      mockReq = makeRequest({ query: {} });
      (roleService.findAll as jest.Mock).mockResolvedValue({
        roles: mockRoles,
        pagination,
      });

      await controller.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(roleService.findAll).toHaveBeenCalledWith(1, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        roles: mockRoles,
        pagination,
      });
    });

    it('should parse page and limit from query parameters', async () => {
      mockReq = makeRequest({ query: { page: '2', limit: '5' } });
      (roleService.findAll as jest.Mock).mockResolvedValue({
        roles: [mockRoles[0]],
        pagination: { ...pagination, page: 2, limit: 5 },
      });

      await controller.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(roleService.findAll).toHaveBeenCalledWith(2, 5);
    });

    it('should use default page (1) if not provided', async () => {
      mockReq = makeRequest({ query: { limit: '20' } });
      (roleService.findAll as jest.Mock).mockResolvedValue({
        roles: mockRoles,
        pagination,
      });

      await controller.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(roleService.findAll).toHaveBeenCalledWith(1, 20);
    });

    it('should use default limit (10) if not provided', async () => {
      mockReq = makeRequest({ query: { page: '3' } });
      (roleService.findAll as jest.Mock).mockResolvedValue({
        roles: [],
        pagination,
      });

      await controller.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(roleService.findAll).toHaveBeenCalledWith(3, 10);
    });

    it('should call next with error on service failure', async () => {
      const error = new Error('Database error');
      mockReq = makeRequest({ query: {} });
      (roleService.findAll as jest.Mock).mockRejectedValue(error);

      await controller.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── FIND BY ID ───────────────────────────────────────────────────────────
  describe('findById', () => {
    it('should find role by ID and return 200 status', async () => {
      const mockRole = makeRole({ id: 5 });
      mockReq = makeRequest({ params: { id: '5' } });
      (roleService.findById as jest.Mock).mockResolvedValue(mockRole);

      await controller.findById(mockReq as Request, mockRes as Response, mockNext);

      expect(roleService.findById).toHaveBeenCalledWith(5);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockRole);
    });

    it('should parse ID from string to number', async () => {
      mockReq = makeRequest({ params: { id: '123' } });
      (roleService.findById as jest.Mock).mockResolvedValue(makeRole({ id: 123 }));

      await controller.findById(mockReq as Request, mockRes as Response, mockNext);

      expect(roleService.findById).toHaveBeenCalledWith(123);
    });

    it('should call next with error when role not found', async () => {
      const error = new NotFoundError('Role not found', 'ROLE_NOT_FOUND');
      mockReq = makeRequest({ params: { id: '999' } });
      (roleService.findById as jest.Mock).mockRejectedValue(error);

      await controller.findById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── FIND BY NAME ─────────────────────────────────────────────────────────
  describe('findByName', () => {
    it('should find role by name and return 200 status', async () => {
      const mockRole = makeRole({ name: 'admin' });
      mockReq = makeRequest({ params: { name: 'admin' } });
      (roleService.findByName as jest.Mock).mockResolvedValue(mockRole);

      await controller.findByName(mockReq as Request, mockRes as Response, mockNext);

      expect(roleService.findByName).toHaveBeenCalledWith('admin');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockRole);
    });

    it('should call next with error when role not found', async () => {
      const error = new NotFoundError('Role not found', 'ROLE_NOT_FOUND');
      mockReq = makeRequest({ params: { name: 'nonexistent' } });
      (roleService.findByName as jest.Mock).mockRejectedValue(error);

      await controller.findByName(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  describe('update', () => {
    const updateDto = { name: 'super_admin', description: 'Super admin role' };

    it('should update role and return 200 status', async () => {
      const mockRole = makeRole(updateDto);
      mockReq = makeRequest({ params: { id: '1' }, body: updateDto });
      (roleService.update as jest.Mock).mockResolvedValue(mockRole);

      await controller.update(mockReq as Request, mockRes as Response, mockNext);

      expect(roleService.update).toHaveBeenCalledWith(1, updateDto);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockRole);
    });

    it('should pass both ID and body to service', async () => {
      mockReq = makeRequest({ params: { id: '5' }, body: updateDto });
      (roleService.update as jest.Mock).mockResolvedValue(makeRole());

      await controller.update(mockReq as Request, mockRes as Response, mockNext);

      expect(roleService.update).toHaveBeenCalledWith(5, updateDto);
    });

    it('should call next with error when role not found', async () => {
      const error = new NotFoundError('Role not found', 'ROLE_NOT_FOUND');
      mockReq = makeRequest({ params: { id: '999' }, body: updateDto });
      (roleService.update as jest.Mock).mockRejectedValue(error);

      await controller.update(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error when new name already taken', async () => {
      const error = new ConflictError('Role name already exists', 'ROLE_ALREADY_EXISTS');
      mockReq = makeRequest({ params: { id: '1' }, body: updateDto });
      (roleService.update as jest.Mock).mockRejectedValue(error);

      await controller.update(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('should delete role and return 204 status', async () => {
      mockReq = makeRequest({ params: { id: '1' } });
      (roleService.delete as jest.Mock).mockResolvedValue(undefined);

      await controller.delete(mockReq as Request, mockRes as Response, mockNext);

      expect(roleService.delete).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should parse ID from string to number', async () => {
      mockReq = makeRequest({ params: { id: '42' } });
      (roleService.delete as jest.Mock).mockResolvedValue(undefined);

      await controller.delete(mockReq as Request, mockRes as Response, mockNext);

      expect(roleService.delete).toHaveBeenCalledWith(42);
    });

    it('should call next with error when role not found', async () => {
      const error = new NotFoundError('Role not found', 'ROLE_NOT_FOUND');
      mockReq = makeRequest({ params: { id: '999' } });
      (roleService.delete as jest.Mock).mockRejectedValue(error);

      await controller.delete(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
