// ─── Env Setup ───────────────────────────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USERNAME = 'root';
process.env.DB_PASSWORD = 'password';
process.env.DB_DATABASE = 'test_db';

jest.mock('../../models/rolePermission.model');
jest.mock('../../models/role.model');
jest.mock('../../models/permission.model');

import RolePermission from '../../models/rolePermission.model';
import Role from '../../models/role.model';
import Permission from '../../models/permission.model';
import { RolePermissionService } from '../../services/rolePermission.service';
import { ConflictError, NotFoundError } from '../../utils/errors';

// ─── Factories ───────────────────────────────────────────────────────────────
const makeRole = (id = 1) => ({ id });
const makePermission = (id = 1) => ({ id });
const makeRolePermission = (overrides: Record<string, any> = {}) => ({
  roleId: 1,
  permissionId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  destroy: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});
const makeRolePermissionWithRelations = (overrides: Record<string, any> = {}) =>
  makeRolePermission({
    role: { id: 1, name: 'admin' },
    permission: { id: 1, name: 'match:read' },
    ...overrides,
  });

const makeFindAndCountAll = (rows: any[], count: number) => ({ rows, count });

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('RolePermissionService', () => {
  let service: RolePermissionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RolePermissionService();
  });

  // ─── CREATE ──────────────────────────────────────────────────────────────
  describe('create', () => {
    const dto = { roleId: 1, permissionId: 1 };

    beforeEach(() => {
      (Role.findByPk as jest.Mock).mockResolvedValue(makeRole());
      (Permission.findByPk as jest.Mock).mockResolvedValue(makePermission());
      (RolePermission.findOne as jest.Mock).mockResolvedValue(null);
      (RolePermission.create as jest.Mock).mockResolvedValue(makeRolePermission());
    });

    it('should create assignment and return it', async () => {
      const result = await service.create(dto);
      expect(result.roleId).toBe(1);
      expect(result.permissionId).toBe(1);
      expect(RolePermission.create).toHaveBeenCalled();
    });

    it('should verify both role and permission exist', async () => {
      await service.create(dto);
      expect(Role.findByPk).toHaveBeenCalledWith(1, { attributes: ['id'] });
      expect(Permission.findByPk).toHaveBeenCalledWith(1, { attributes: ['id'] });
    });

    it('should throw NotFoundError when role does not exist', async () => {
      (Role.findByPk as jest.Mock).mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundError);
      expect(RolePermission.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when permission does not exist', async () => {
      (Permission.findByPk as jest.Mock).mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundError);
      expect(RolePermission.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictError when assignment already exists', async () => {
      (RolePermission.findOne as jest.Mock).mockResolvedValue(makeRolePermission());
      await expect(service.create(dto)).rejects.toThrow(ConflictError);
      expect(RolePermission.create).not.toHaveBeenCalled();
    });
  });

  // ─── FIND ALL ─────────────────────────────────────────────────────────────
  describe('findAll', () => {
    const rows = [makeRolePermissionWithRelations()];

    it('should return paginated results with default pagination (page=1, limit=10)', async () => {
      (RolePermission.findAndCountAll as jest.Mock).mockResolvedValue(makeFindAndCountAll(rows, 1));

      const { rolePermissions, pagination } = await service.findAll();

      expect(rolePermissions).toEqual(rows);
      expect(pagination).toMatchObject({ total: 1, page: 1, limit: 10 });
    });

    it('should include Role and Permission relations in each row', async () => {
      (RolePermission.findAndCountAll as jest.Mock).mockResolvedValue(makeFindAndCountAll(rows, 1));

      const { rolePermissions } = await service.findAll();

      expect(rolePermissions).toHaveLength(1);
      const first = rolePermissions[0]!;
      expect(first.role).toBeDefined();
      expect(first.permission).toBeDefined();
    });

    it('should apply correct offset for page=3, limit=10', async () => {
      (RolePermission.findAndCountAll as jest.Mock).mockResolvedValue(makeFindAndCountAll([], 25));

      await service.findAll(3, 10);

      expect(RolePermission.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 20, limit: 10 })
      );
    });
  });

  // ─── FIND BY ROLE ID ─────────────────────────────────────────────────────
  describe('findByRoleId', () => {
    const rows = [makeRolePermission({ permission: { id: 1, name: 'match:read' } })];

    it('should return permissions for a role with pagination', async () => {
      (Role.findByPk as jest.Mock).mockResolvedValue(makeRole());
      (RolePermission.findAndCountAll as jest.Mock).mockResolvedValue(makeFindAndCountAll(rows, 1));

      const { rolePermissions, pagination } = await service.findByRoleId(1);

      expect(rolePermissions).toEqual(rows);
      expect(pagination.total).toBe(1);
      expect(rolePermissions[0]!.permission).toBeDefined();
    });

    it('should throw NotFoundError when role does not exist', async () => {
      (Role.findByPk as jest.Mock).mockResolvedValue(null);
      await expect(service.findByRoleId(999)).rejects.toThrow(NotFoundError);
    });

    it('should filter by roleId and apply correct offset', async () => {
      (Role.findByPk as jest.Mock).mockResolvedValue(makeRole());
      (RolePermission.findAndCountAll as jest.Mock).mockResolvedValue(makeFindAndCountAll([], 50));

      const { pagination } = await service.findByRoleId(1, 2, 10);

      expect(RolePermission.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 10, limit: 10, where: { roleId: 1 } })
      );
      expect(pagination.totalPages).toBe(5);
    });
  });

  // ─── FIND BY PERMISSION ID ────────────────────────────────────────────────
  describe('findByPermissionId', () => {
    const rows = [makeRolePermission({ role: { id: 1, name: 'admin' } })];

    it('should return roles that have the permission', async () => {
      (Permission.findByPk as jest.Mock).mockResolvedValue(makePermission());
      (RolePermission.findAndCountAll as jest.Mock).mockResolvedValue(makeFindAndCountAll(rows, 1));

      const { rolePermissions, pagination } = await service.findByPermissionId(1);

      expect(rolePermissions).toEqual(rows);
      expect(pagination.total).toBe(1);
      expect(rolePermissions[0]!.role).toBeDefined();
    });

    it('should throw NotFoundError when permission does not exist', async () => {
      (Permission.findByPk as jest.Mock).mockResolvedValue(null);
      await expect(service.findByPermissionId(999)).rejects.toThrow(NotFoundError);
    });

    it('should filter by permissionId', async () => {
      (Permission.findByPk as jest.Mock).mockResolvedValue(makePermission());
      (RolePermission.findAndCountAll as jest.Mock).mockResolvedValue(makeFindAndCountAll(rows, 1));

      await service.findByPermissionId(1);

      expect(RolePermission.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { permissionId: 1 } })
      );
    });
  });

  // ─── HAS PERMISSION ───────────────────────────────────────────────────────
  describe('hasPermission', () => {
    it.each([
      [1, true],
      [0, false],
    ])('should return %s when count is %i', async (count, expected) => {
      (RolePermission.count as jest.Mock).mockResolvedValue(count);
      expect(await service.hasPermission(1, 1)).toBe(expected);
    });

    it('should query with the correct roleId and permissionId', async () => {
      (RolePermission.count as jest.Mock).mockResolvedValue(1);
      await service.hasPermission(5, 10);
      expect(RolePermission.count).toHaveBeenCalledWith({ where: { roleId: 5, permissionId: 10 } });
    });
  });

  // ─── BULK CREATE ──────────────────────────────────────────────────────────
  describe('bulkCreate', () => {
    const permissionIds = [1, 2, 3];

    beforeEach(() => {
      (Role.findByPk as jest.Mock).mockResolvedValue(makeRole());
      (Permission.findAll as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
      (RolePermission.findAll as jest.Mock).mockResolvedValue([]);
    });

    it('should create all new assignments', async () => {
      const created = permissionIds.map((permissionId) => ({ roleId: 1, permissionId }));
      (RolePermission.bulkCreate as jest.Mock).mockResolvedValue(created);

      const result = await service.bulkCreate(1, permissionIds);

      expect(result).toHaveLength(3);
      expect(RolePermission.bulkCreate).toHaveBeenCalled();
    });

    it('should skip already-assigned permissions and create only new ones', async () => {
      (RolePermission.findAll as jest.Mock).mockResolvedValue([{ permissionId: 1 }]);
      (RolePermission.bulkCreate as jest.Mock).mockResolvedValue([
        { roleId: 1, permissionId: 2 },
        { roleId: 1, permissionId: 3 },
      ]);

      const result = await service.bulkCreate(1, permissionIds);

      expect(result).toHaveLength(2);
      expect(RolePermission.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([{ roleId: 1, permissionId: 2 }, { roleId: 1, permissionId: 3 }])
      );
    });

    it('should return empty array when all permissions already assigned', async () => {
      (RolePermission.findAll as jest.Mock).mockResolvedValue(
        permissionIds.map((permissionId) => ({ permissionId }))
      );

      const result = await service.bulkCreate(1, permissionIds);

      expect(result).toEqual([]);
      expect(RolePermission.bulkCreate).not.toHaveBeenCalled();
    });

    it('should return empty array immediately when permissionIds is empty', async () => {
      const result = await service.bulkCreate(1, []);
      expect(result).toEqual([]);
      expect(Role.findByPk).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when role does not exist', async () => {
      (Role.findByPk as jest.Mock).mockResolvedValue(null);
      await expect(service.bulkCreate(999, permissionIds)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when some permissions are missing', async () => {
      (Permission.findAll as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]); // missing id 3
      await expect(service.bulkCreate(1, permissionIds)).rejects.toThrow(NotFoundError);
    });
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────
  describe('deleteByRoleIdAndPermissionId', () => {
    it('should delete the assignment', async () => {
      const mock = makeRolePermission();
      (RolePermission.findOne as jest.Mock).mockResolvedValue(mock);

      await service.deleteByRoleIdAndPermissionId(1, 1);

      expect(mock.destroy).toHaveBeenCalled();
    });

    it('should throw NotFoundError when assignment does not exist', async () => {
      (RolePermission.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.deleteByRoleIdAndPermissionId(1, 1)).rejects.toThrow(NotFoundError);
    });

    it('should query with the correct roleId and permissionId', async () => {
      (RolePermission.findOne as jest.Mock).mockResolvedValue(makeRolePermission());
      await service.deleteByRoleIdAndPermissionId(5, 10);
      expect(RolePermission.findOne).toHaveBeenCalledWith({ where: { roleId: 5, permissionId: 10 } });
    });
  });
});