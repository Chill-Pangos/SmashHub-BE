// ─── Env Setup ───────────────────────────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USERNAME = 'root';
process.env.DB_PASSWORD = 'password';
process.env.DB_DATABASE = 'test_db';

jest.mock('../../services/userRole.service');

import { Request, Response, NextFunction } from 'express';
import { UserRoleController } from '../../controllers/userRole.controller';
import userRoleService from '../../services/userRole.service';
import { ConflictError, NotFoundError } from '../../utils/errors';

// ─── Factories ───────────────────────────────────────────────────────────────
const makeUserRole = (overrides: Record<string, any> = {}) => ({
  userId: 1,
  roleId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  User: { id: 1, email: 'john@example.com', firstName: 'John', lastName: 'Doe' },
  Role: { id: 1, name: 'admin' },
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
describe('UserRoleController', () => {
  let controller: UserRoleController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UserRoleController();
    mockNext = jest.fn();
    mockRes = makeResponse();
  });

  // ─── CREATE ──────────────────────────────────────────────────────────────
  describe('create', () => {
    const createDto = { userId: 1, roleId: 1 };

    it('should create user-role assignment and return 201 status', async () => {
      const mockData = makeUserRole();
      mockReq = makeRequest({ body: createDto });
      (userRoleService.create as jest.Mock).mockResolvedValue(mockData);

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockData);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass request body to service', async () => {
      mockReq = makeRequest({ body: createDto });
      (userRoleService.create as jest.Mock).mockResolvedValue(makeUserRole());

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(userRoleService.create).toHaveBeenCalledWith(createDto);
    });

    it('should call next with error when user not found', async () => {
      const error = new NotFoundError('User not found', 'USER_NOT_FOUND');
      mockReq = makeRequest({ body: createDto });
      (userRoleService.create as jest.Mock).mockRejectedValue(error);

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next with error when role not found', async () => {
      const error = new NotFoundError('Role not found', 'ROLE_NOT_FOUND');
      mockReq = makeRequest({ body: createDto });
      (userRoleService.create as jest.Mock).mockRejectedValue(error);

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next with error when assignment already exists', async () => {
      const error = new ConflictError('Role already assigned to user', 'USER_ROLE_ALREADY_EXISTS');
      mockReq = makeRequest({ body: createDto });
      (userRoleService.create as jest.Mock).mockRejectedValue(error);

      await controller.create(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── FIND ALL ─────────────────────────────────────────────────────────────
  describe('findAll', () => {
    const mockUserRoles = [
      makeUserRole({ userId: 1, roleId: 1 }),
      makeUserRole({ userId: 2, roleId: 2, User: { id: 2, email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith' }, Role: { id: 2, name: 'user' } }),
    ];
    const pagination = {
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };

    it('should find all user-roles with default pagination', async () => {
      mockReq = makeRequest({ query: {} });
      (userRoleService.findAll as jest.Mock).mockResolvedValue({
        userRoles: mockUserRoles,
        pagination,
      });

      await controller.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(userRoleService.findAll).toHaveBeenCalledWith(1, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        userRoles: mockUserRoles,
        pagination,
      });
    });

    it('should parse page and limit from query parameters', async () => {
      mockReq = makeRequest({ query: { page: '3', limit: '20' } });
      (userRoleService.findAll as jest.Mock).mockResolvedValue({
        userRoles: [mockUserRoles[0]],
        pagination: { ...pagination, page: 3, limit: 20 },
      });

      await controller.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(userRoleService.findAll).toHaveBeenCalledWith(3, 20);
    });

    it('should use default values for missing parameters', async () => {
      mockReq = makeRequest({ query: {} });
      (userRoleService.findAll as jest.Mock).mockResolvedValue({
        userRoles: [],
        pagination,
      });

      await controller.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(userRoleService.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('should call next with error on service failure', async () => {
      const error = new Error('Database error');
      mockReq = makeRequest({ query: {} });
      (userRoleService.findAll as jest.Mock).mockRejectedValue(error);

      await controller.findAll(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── FIND BY USER ID ──────────────────────────────────────────────────────
  describe('findByUserId', () => {
    const mockUserRoles = [
      makeUserRole({ userId: 1, roleId: 1 }),
    ];
    const pagination = {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };

    it('should find roles for a user and return 200 status', async () => {
      mockReq = makeRequest({ params: { userId: '1' }, query: {} });
      (userRoleService.findByUserId as jest.Mock).mockResolvedValue({
        userRoles: mockUserRoles,
        pagination,
      });

      await controller.findByUserId(mockReq as Request, mockRes as Response, mockNext);

      expect(userRoleService.findByUserId).toHaveBeenCalledWith(1, 1, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        userRoles: mockUserRoles,
        pagination,
      });
    });

    it('should parse userId and pagination from parameters', async () => {
      mockReq = makeRequest({ params: { userId: '5' }, query: { page: '2', limit: '20' } });
      (userRoleService.findByUserId as jest.Mock).mockResolvedValue({
        userRoles: [],
        pagination,
      });

      await controller.findByUserId(mockReq as Request, mockRes as Response, mockNext);

      expect(userRoleService.findByUserId).toHaveBeenCalledWith(5, 2, 20);
    });

    it('should use default pagination values', async () => {
      mockReq = makeRequest({ params: { userId: '1' }, query: {} });
      (userRoleService.findByUserId as jest.Mock).mockResolvedValue({
        userRoles: [],
        pagination,
      });

      await controller.findByUserId(mockReq as Request, mockRes as Response, mockNext);

      expect(userRoleService.findByUserId).toHaveBeenCalledWith(1, 1, 10);
    });

    it('should call next with error when user not found', async () => {
      const error = new NotFoundError('User not found', 'USER_NOT_FOUND');
      mockReq = makeRequest({ params: { userId: '999' }, query: {} });
      (userRoleService.findByUserId as jest.Mock).mockRejectedValue(error);

      await controller.findByUserId(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── FIND BY ROLE ID ──────────────────────────────────────────────────────
  describe('findByRoleId', () => {
    const mockUserRoles = [
      makeUserRole({ userId: 1, roleId: 1 }),
    ];
    const pagination = {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };

    it('should find users with a role and return 200 status', async () => {
      mockReq = makeRequest({ params: { roleId: '1' }, query: {} });
      (userRoleService.findByRoleId as jest.Mock).mockResolvedValue({
        userRoles: mockUserRoles,
        pagination,
      });

      await controller.findByRoleId(mockReq as Request, mockRes as Response, mockNext);

      expect(userRoleService.findByRoleId).toHaveBeenCalledWith(1, 1, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        userRoles: mockUserRoles,
        pagination,
      });
    });

    it('should parse roleId and pagination from parameters', async () => {
      mockReq = makeRequest({ params: { roleId: '10' }, query: { page: '3', limit: '15' } });
      (userRoleService.findByRoleId as jest.Mock).mockResolvedValue({
        userRoles: [],
        pagination,
      });

      await controller.findByRoleId(mockReq as Request, mockRes as Response, mockNext);

      expect(userRoleService.findByRoleId).toHaveBeenCalledWith(10, 3, 15);
    });

    it('should call next with error when role not found', async () => {
      const error = new NotFoundError('Role not found', 'ROLE_NOT_FOUND');
      mockReq = makeRequest({ params: { roleId: '999' }, query: {} });
      (userRoleService.findByRoleId as jest.Mock).mockRejectedValue(error);

      await controller.findByRoleId(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── HAS ROLE ──────────────────────────────────────────────────────────────
  describe('hasRole', () => {
    it('should check if user has role and return result', async () => {
      mockReq = makeRequest({ query: { userId: '1', roleId: '1' } });
      (userRoleService.hasRole as jest.Mock).mockResolvedValue(true);

      await controller.hasRole(mockReq as Request, mockRes as Response, mockNext);

      expect(userRoleService.hasRole).toHaveBeenCalledWith(1, 1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ hasRole: true });
    });

    it('should return false when user does not have role', async () => {
      mockReq = makeRequest({ query: { userId: '1', roleId: '2' } });
      (userRoleService.hasRole as jest.Mock).mockResolvedValue(false);

      await controller.hasRole(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ hasRole: false });
    });

    it('should parse userId and roleId from query parameters', async () => {
      mockReq = makeRequest({ query: { userId: '5', roleId: '10' } });
      (userRoleService.hasRole as jest.Mock).mockResolvedValue(true);

      await controller.hasRole(mockReq as Request, mockRes as Response, mockNext);

      expect(userRoleService.hasRole).toHaveBeenCalledWith(5, 10);
    });

    it('should call next with error on service failure', async () => {
      const error = new Error('Database error');
      mockReq = makeRequest({ query: { userId: '1', roleId: '1' } });
      (userRoleService.hasRole as jest.Mock).mockRejectedValue(error);

      await controller.hasRole(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  // ─── DELETE BY USER ID AND ROLE ID ────────────────────────────────────────
  describe('deleteByUserIdAndRoleId', () => {
    it('should delete user-role assignment and return 204 status', async () => {
      mockReq = makeRequest({ params: { userId: '1', roleId: '1' } });
      (userRoleService.deleteByUserIdAndRoleId as jest.Mock).mockResolvedValue(undefined);

      await controller.deleteByUserIdAndRoleId(mockReq as Request, mockRes as Response, mockNext);

      expect(userRoleService.deleteByUserIdAndRoleId).toHaveBeenCalledWith(1, 1);
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it('should parse userId and roleId from parameters', async () => {
      mockReq = makeRequest({ params: { userId: '5', roleId: '10' } });
      (userRoleService.deleteByUserIdAndRoleId as jest.Mock).mockResolvedValue(undefined);

      await controller.deleteByUserIdAndRoleId(mockReq as Request, mockRes as Response, mockNext);

      expect(userRoleService.deleteByUserIdAndRoleId).toHaveBeenCalledWith(5, 10);
    });

    it('should call next with error when assignment not found', async () => {
      const error = new NotFoundError('User-role assignment not found', 'USER_ROLE_NOT_FOUND');
      mockReq = makeRequest({ params: { userId: '1', roleId: '999' } });
      (userRoleService.deleteByUserIdAndRoleId as jest.Mock).mockRejectedValue(error);

      await controller.deleteByUserIdAndRoleId(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should not send response when error occurs', async () => {
      const error = new Error('Database error');
      mockReq = makeRequest({ params: { userId: '1', roleId: '1' } });
      (userRoleService.deleteByUserIdAndRoleId as jest.Mock).mockRejectedValue(error);

      await controller.deleteByUserIdAndRoleId(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.send).not.toHaveBeenCalled();
    });
  });
});
