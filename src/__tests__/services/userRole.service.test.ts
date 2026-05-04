// ─── Env Setup ───────────────────────────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USERNAME = 'root';
process.env.DB_PASSWORD = 'password';
process.env.DB_DATABASE = 'test_db';

jest.mock('../../models/userRole.model');
jest.mock('../../models/user.model');
jest.mock('../../models/role.model');

import UserRole from '../../models/userRole.model';
import User from '../../models/user.model';
import Role from '../../models/role.model';
import { UserRoleService } from '../../services/userRole.service';
import { ConflictError, NotFoundError } from '../../utils/errors';

// ─── Factories ───────────────────────────────────────────────────────────────
const makeUser = (id = 1) => ({
  id,
  email: `user${id}@example.com`,
  firstName: 'John',
  lastName: 'Doe',
});

const makeRole = (id = 1, name = 'admin') => ({ id, name });

const makeUserRole = (overrides: Record<string, any> = {}) => ({
  userId: 1,
  roleId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  destroy: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const makeUserRoleWithRelations = (userId = 1, roleId = 1) =>
  makeUserRole({
    userId,
    roleId,
    user: makeUser(userId),
    role: makeRole(roleId),
  });

const makeFindAndCountAll = (rows: any[], count: number) => ({ rows, count });

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('UserRoleService', () => {
  let service: UserRoleService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserRoleService();
  });

  // ─── CREATE ──────────────────────────────────────────────────────────────
  describe('create', () => {
    const dto = { userId: 1, roleId: 1 };

    beforeEach(() => {
      (User.findByPk as jest.Mock).mockResolvedValue(makeUser());
      (Role.findByPk as jest.Mock).mockResolvedValue(makeRole());
      (UserRole.findOne as jest.Mock).mockResolvedValue(null);
      (UserRole.create as jest.Mock).mockResolvedValue(makeUserRole());
    });

    it('should create assignment and return it', async () => {
      const result = await service.create(dto);
      expect(result.userId).toBe(1);
      expect(result.roleId).toBe(1);
      expect(UserRole.create).toHaveBeenCalled();
    });

    it('should verify both user and role exist', async () => {
      await service.create(dto);
      expect(User.findByPk).toHaveBeenCalledWith(1, { attributes: ['id'] });
      expect(Role.findByPk).toHaveBeenCalledWith(1, { attributes: ['id'] });
    });

    it('should throw NotFoundError when user does not exist', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundError);
      expect(UserRole.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when role does not exist', async () => {
      (Role.findByPk as jest.Mock).mockResolvedValue(null);
      await expect(service.create(dto)).rejects.toThrow(NotFoundError);
      expect(UserRole.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictError when assignment already exists', async () => {
      (UserRole.findOne as jest.Mock).mockResolvedValue(makeUserRole());
      await expect(service.create(dto)).rejects.toThrow(ConflictError);
      expect(UserRole.create).not.toHaveBeenCalled();
    });
  });

  // ─── FIND ALL ─────────────────────────────────────────────────────────────
  describe('findAll', () => {
    const rows = [makeUserRoleWithRelations(1, 1)];

    it('should return user-roles with default pagination (page=1, limit=10)', async () => {
      (UserRole.findAndCountAll as jest.Mock).mockResolvedValue(makeFindAndCountAll(rows, 1));

      const { userRoles, pagination } = await service.findAll();

      expect(userRoles).toEqual(rows);
      expect(pagination).toMatchObject({ total: 1, page: 1, limit: 10 });
      expect(UserRole.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 0, limit: 10, order: [['createdAt', 'DESC']] })
      );
    });

    it('should include User and Role relations', async () => {
      (UserRole.findAndCountAll as jest.Mock).mockResolvedValue(makeFindAndCountAll(rows, 1));

      const { userRoles } = await service.findAll();

      expect(userRoles).toHaveLength(1);
      const first = userRoles[0]!;
      expect(first.user).toBeDefined();
      expect(first.role).toBeDefined();
      expect(first.user?.email).toBe('user1@example.com');
    });

    it('should apply correct offset for page=3, limit=10', async () => {
      (UserRole.findAndCountAll as jest.Mock).mockResolvedValue(makeFindAndCountAll([], 50));

      const { pagination } = await service.findAll(3, 10);

      expect(UserRole.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 20, limit: 10 })
      );
      expect(pagination.totalPages).toBe(5);
    });
  });

  // ─── FIND BY USER ID ─────────────────────────────────────────────────────
  describe('findByUserId', () => {
    const rows = [
      makeUserRole({ roleId: 1, role: makeRole(1, 'admin') }),
      makeUserRole({ roleId: 2, role: makeRole(2, 'user') }),
    ];

    it('should return roles for a user with pagination', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(makeUser());
      (UserRole.findAndCountAll as jest.Mock).mockResolvedValue(makeFindAndCountAll(rows, 2));

      const { userRoles, pagination } = await service.findByUserId(1);

      expect(userRoles).toEqual(rows);
      expect(pagination.total).toBe(2);
      expect(userRoles[0]!.role).toBeDefined();
    });

    it('should throw NotFoundError when user does not exist', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);
      await expect(service.findByUserId(999)).rejects.toThrow(NotFoundError);
    });

    it('should filter by userId and apply correct offset', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(makeUser());
      (UserRole.findAndCountAll as jest.Mock).mockResolvedValue(makeFindAndCountAll([], 20));

      const { pagination } = await service.findByUserId(1, 2, 10);

      expect(UserRole.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 10, limit: 10, where: { userId: 1 } })
      );
      expect(pagination.totalPages).toBe(2);
    });

    it('should return empty array when user has no roles', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(makeUser());
      (UserRole.findAndCountAll as jest.Mock).mockResolvedValue(makeFindAndCountAll([], 0));

      const { userRoles, pagination } = await service.findByUserId(1);

      expect(userRoles).toEqual([]);
      expect(pagination.total).toBe(0);
    });
  });

  // ─── FIND BY ROLE ID ─────────────────────────────────────────────────────
  describe('findByRoleId', () => {
    const rows = [
      makeUserRole({ userId: 1, user: makeUser(1) }),
      makeUserRole({ userId: 2, user: makeUser(2) }),
    ];

    it('should return users that have the role', async () => {
      (Role.findByPk as jest.Mock).mockResolvedValue(makeRole());
      (UserRole.findAndCountAll as jest.Mock).mockResolvedValue(makeFindAndCountAll(rows, 2));

      const { userRoles, pagination } = await service.findByRoleId(1);

      expect(userRoles).toEqual(rows);
      expect(pagination.total).toBe(2);
      expect(userRoles[0]!.user).toBeDefined();
    });

    it('should throw NotFoundError when role does not exist', async () => {
      (Role.findByPk as jest.Mock).mockResolvedValue(null);
      await expect(service.findByRoleId(999)).rejects.toThrow(NotFoundError);
    });

    it('should filter by roleId and apply correct offset', async () => {
      (Role.findByPk as jest.Mock).mockResolvedValue(makeRole());
      (UserRole.findAndCountAll as jest.Mock).mockResolvedValue(makeFindAndCountAll([], 100));

      const { pagination } = await service.findByRoleId(1, 5, 10);

      expect(UserRole.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 40, limit: 10, where: { roleId: 1 } })
      );
      expect(pagination.totalPages).toBe(10);
    });
  });

  // ─── HAS ROLE ─────────────────────────────────────────────────────────────
  describe('hasRole', () => {
    it.each([
      [1, true],
      [0, false],
    ])('should return %s when count is %i', async (count, expected) => {
      (UserRole.count as jest.Mock).mockResolvedValue(count);
      expect(await service.hasRole(1, 1)).toBe(expected);
    });

    it('should query with the correct userId and roleId', async () => {
      (UserRole.count as jest.Mock).mockResolvedValue(1);
      await service.hasRole(5, 10);
      expect(UserRole.count).toHaveBeenCalledWith({ where: { userId: 5, roleId: 10 } });
    });
  });

  // ─── BULK CREATE ──────────────────────────────────────────────────────────
  describe('bulkCreate', () => {
    const roleIds = [1, 2, 3];

    beforeEach(() => {
      (User.findByPk as jest.Mock).mockResolvedValue(makeUser());
      (Role.findAll as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
      (UserRole.findAll as jest.Mock).mockResolvedValue([]);
    });

    it('should create all new assignments', async () => {
      const created = roleIds.map((roleId) => ({ userId: 1, roleId }));
      (UserRole.bulkCreate as jest.Mock).mockResolvedValue(created);

      const result = await service.bulkCreate(1, roleIds);

      expect(result).toHaveLength(3);
      expect(UserRole.bulkCreate).toHaveBeenCalled();
    });

    it('should skip already-assigned roles and create only new ones', async () => {
      (UserRole.findAll as jest.Mock).mockResolvedValue([{ roleId: 1 }]);
      (UserRole.bulkCreate as jest.Mock).mockResolvedValue([
        { userId: 1, roleId: 2 },
        { userId: 1, roleId: 3 },
      ]);

      const result = await service.bulkCreate(1, roleIds);

      expect(result).toHaveLength(2);
      expect(UserRole.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([{ userId: 1, roleId: 2 }, { userId: 1, roleId: 3 }])
      );
    });

    it('should return empty array when all roles already assigned', async () => {
      (UserRole.findAll as jest.Mock).mockResolvedValue(roleIds.map((roleId) => ({ roleId })));

      const result = await service.bulkCreate(1, roleIds);

      expect(result).toEqual([]);
      expect(UserRole.bulkCreate).not.toHaveBeenCalled();
    });

    it('should return empty array immediately when roleIds is empty', async () => {
      const result = await service.bulkCreate(1, []);
      expect(result).toEqual([]);
      expect(User.findByPk).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when user does not exist', async () => {
      (User.findByPk as jest.Mock).mockResolvedValue(null);
      await expect(service.bulkCreate(999, roleIds)).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError when some roles are missing', async () => {
      (Role.findAll as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]); // missing id 3
      await expect(service.bulkCreate(1, roleIds)).rejects.toThrow(NotFoundError);
    });
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────
  describe('deleteByUserIdAndRoleId', () => {
    it('should delete the assignment', async () => {
      const mock = makeUserRole();
      (UserRole.findOne as jest.Mock).mockResolvedValue(mock);

      await service.deleteByUserIdAndRoleId(1, 1);

      expect(mock.destroy).toHaveBeenCalled();
    });

    it('should throw NotFoundError when assignment does not exist', async () => {
      (UserRole.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.deleteByUserIdAndRoleId(1, 1)).rejects.toThrow(NotFoundError);
    });

    it('should query with the correct userId and roleId', async () => {
      (UserRole.findOne as jest.Mock).mockResolvedValue(makeUserRole());
      await service.deleteByUserIdAndRoleId(5, 10);
      expect(UserRole.findOne).toHaveBeenCalledWith({ where: { userId: 5, roleId: 10 } });
    });
  });
});