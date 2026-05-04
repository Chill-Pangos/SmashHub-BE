// Set environment variables FIRST
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USERNAME = 'root';
process.env.DB_PASSWORD = 'password';
process.env.DB_DATABASE = 'test_db';

// Hoist jest.mock calls
jest.mock('../../models/permission.model');

import Permission from '../../models/permission.model';
import { PermissionService } from '../../services/permission.service';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/errors';

describe('PermissionService', () => {
  let permissionService: PermissionService;

  beforeEach(() => {
    jest.clearAllMocks();
    permissionService = new PermissionService();
  });

  // ─────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────
  describe('Create', () => {
    const basePermissionDto = { name: 'match:read' };

    it('should create permission successfully', async () => {
      const mockPermission = { id: 1, ...basePermissionDto, createdAt: new Date(), updatedAt: new Date() };
      (Permission.findOne as jest.Mock).mockResolvedValue(null);
      (Permission.create as jest.Mock).mockResolvedValue(mockPermission);

      const result = await permissionService.create(basePermissionDto);

      expect(result.id).toBe(1);
      expect(result.name).toBe('match:read');
    });

    it('should throw error if name is empty', async () => {
      await expect(permissionService.create({ name: '' })).rejects.toThrow(BadRequestError);
    });

    it('should throw error if name is whitespace only', async () => {
      await expect(permissionService.create({ name: '   ' })).rejects.toThrow(BadRequestError);
    });

    it('should validate permission name format (resource:action)', async () => {
      const invalidFormats = [
        'match',          // missing action
        'match:',         // missing action value
        ':read',          // missing resource
        'match_read',     // missing colon
        'Match:Read',     // uppercase (should be lowercase)
        'match:read:extra', // too many parts
        'match@read',     // invalid characters
      ];

      for (const invalidName of invalidFormats) {
        await expect(permissionService.create({ name: invalidName })).rejects.toThrow(BadRequestError);
      }
    });

    it('should accept valid permission names', async () => {
      const validNames = ['match:read', 'match:write', 'tournament:delete', 'user_profile:edit', 'user_role:create'];

      for (const validName of validNames) {
        (Permission.findOne as jest.Mock).mockResolvedValue(null);
        (Permission.create as jest.Mock).mockResolvedValue({ id: 1, name: validName, createdAt: new Date(), updatedAt: new Date() });

        const result = await permissionService.create({ name: validName });

        expect(result.name).toBe(validName);
      }
    });

    it('should throw error if name already exists', async () => {
      (Permission.findOne as jest.Mock).mockResolvedValue({ id: 1, name: 'match:read' });

      await expect(permissionService.create(basePermissionDto)).rejects.toThrow(ConflictError);
    });

    it('should check for existing name before creating', async () => {
      (Permission.findOne as jest.Mock).mockResolvedValue(null);
      (Permission.create as jest.Mock).mockResolvedValue({ id: 1, ...basePermissionDto });

      await permissionService.create(basePermissionDto);

      expect(Permission.findOne).toHaveBeenCalledWith({ where: { name: basePermissionDto.name } });
    });
  });

  // ─────────────────────────────────────────────
  // FIND ALL
  // ─────────────────────────────────────────────
  describe('Find All', () => {
    const mockPermissions = [
      { id: 1, name: 'match:read', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'match:write', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: 'tournament:delete', createdAt: new Date(), updatedAt: new Date() },
    ];

    it('should return paginated permissions with default pagination', async () => {
      (Permission.findAndCountAll as jest.Mock).mockResolvedValue({ rows: mockPermissions, count: 3 });

      const result = await permissionService.findAll();

      expect(result.permissions).toEqual(mockPermissions);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPrevPage).toBe(false);
    });

    it('should handle custom pagination parameters', async () => {
      (Permission.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [mockPermissions[0]], count: 25 });

      const result = await permissionService.findAll(2, 5);

      expect(Permission.findAndCountAll).toHaveBeenCalledWith({
        offset: 5,
        limit: 5,
        order: [['createdAt', 'DESC']],
      });
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(5);
      expect(result.pagination.totalPages).toBe(5);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPrevPage).toBe(true);
    });

    it('should return empty permissions array', async () => {
      (Permission.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

      const result = await permissionService.findAll();

      expect(result.permissions).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should order results by createdAt descending', async () => {
      (Permission.findAndCountAll as jest.Mock).mockResolvedValue({ rows: mockPermissions, count: 3 });

      await permissionService.findAll();

      expect(Permission.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['createdAt', 'DESC']],
        })
      );
    });
  });

  // ─────────────────────────────────────────────
  // FIND BY ID
  // ─────────────────────────────────────────────
  describe('Find By ID', () => {
    const mockPermission = { id: 1, name: 'match:read', createdAt: new Date(), updatedAt: new Date() };

    it('should find permission by ID successfully', async () => {
      (Permission.findByPk as jest.Mock).mockResolvedValue(mockPermission);

      const result = await permissionService.findById(1);

      expect(result).toEqual(mockPermission);
      expect(Permission.findByPk).toHaveBeenCalledWith(1);
    });

    it('should throw error if permission not found', async () => {
      (Permission.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(permissionService.findById(999)).rejects.toThrow(NotFoundError);
    });
  });

  // ─────────────────────────────────────────────
  // FIND BY NAME
  // ─────────────────────────────────────────────
  describe('Find By Name', () => {
    const mockPermission = { id: 1, name: 'match:read', createdAt: new Date(), updatedAt: new Date() };

    it('should find permission by name successfully', async () => {
      (Permission.findOne as jest.Mock).mockResolvedValue(mockPermission);

      const result = await permissionService.findByName('match:read');

      expect(result).toEqual(mockPermission);
      expect(Permission.findOne).toHaveBeenCalledWith({ where: { name: 'match:read' } });
    });

    it('should throw error if permission not found by name', async () => {
      (Permission.findOne as jest.Mock).mockResolvedValue(null);

      await expect(permissionService.findByName('nonexistent:action')).rejects.toThrow(NotFoundError);
    });
  });

  // ─────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────
  describe('Update', () => {
    const mockPermission = {
      id: 1,
      name: 'match:read',
      update: jest.fn().mockResolvedValue(undefined),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update permission name successfully', async () => {
      (Permission.findByPk as jest.Mock).mockResolvedValue(mockPermission);
      (Permission.findOne as jest.Mock).mockResolvedValue(null);

      await permissionService.update(1, { name: 'match:write' });

      expect(mockPermission.update).toHaveBeenCalledWith({ name: 'match:write' });
    });

    it('should validate new name format when updating', async () => {
      (Permission.findByPk as jest.Mock).mockResolvedValue(mockPermission);

      await expect(permissionService.update(1, { name: 'invalid_format' })).rejects.toThrow(BadRequestError);
    });

    it('should check name uniqueness when updating name', async () => {
      (Permission.findByPk as jest.Mock).mockResolvedValue(mockPermission);
      (Permission.findOne as jest.Mock).mockResolvedValue(null);

      await permissionService.update(1, { name: 'tournament:read' });

      expect(Permission.findOne).toHaveBeenCalledWith({ where: { name: 'tournament:read' } });
    });

    it('should throw error if new name already exists', async () => {
      (Permission.findByPk as jest.Mock).mockResolvedValue(mockPermission);
      (Permission.findOne as jest.Mock).mockResolvedValue({ id: 2, name: 'tournament:read' });

      await expect(permissionService.update(1, { name: 'tournament:read' })).rejects.toThrow(ConflictError);
    });

    it('should allow same name on current permission', async () => {
      (Permission.findByPk as jest.Mock).mockResolvedValue(mockPermission);
      (Permission.findOne as jest.Mock).mockResolvedValue(mockPermission);

      await permissionService.update(1, { name: 'match:read' });

      expect(mockPermission.update).toHaveBeenCalledWith({ name: 'match:read' });
    });

    it('should throw error if permission not found', async () => {
      (Permission.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(permissionService.update(999, { name: 'match:delete' })).rejects.toThrow(NotFoundError);
    });

    it('should handle partial updates', async () => {
      (Permission.findByPk as jest.Mock).mockResolvedValue(mockPermission);

      await permissionService.update(1, {});

      expect(mockPermission.update).toHaveBeenCalledWith({});
    });
  });

  // ─────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────
  describe('Delete', () => {
    const mockPermission = {
      id: 1,
      name: 'match:read',
      destroy: jest.fn().mockResolvedValue(undefined),
    };

    it('should delete permission successfully', async () => {
      (Permission.findByPk as jest.Mock).mockResolvedValue(mockPermission);

      await permissionService.delete(1);

      expect(mockPermission.destroy).toHaveBeenCalled();
    });

    it('should throw error if permission not found', async () => {
      (Permission.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(permissionService.delete(999)).rejects.toThrow(NotFoundError);
    });
  });
});
