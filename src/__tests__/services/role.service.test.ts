// ─── Env Setup ───────────────────────────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USERNAME = 'root';
process.env.DB_PASSWORD = 'password';
process.env.DB_DATABASE = 'test_db';

jest.mock('../../models/role.model');

import Role from '../../models/role.model';
import { RoleService } from '../../services/role.service';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/errors';

// ─── Factories ───────────────────────────────────────────────────────────────
const makeRole = (overrides: Record<string, any> = {}) => ({
  id: 1,
  name: 'admin',
  description: 'Administrator role',
  createdAt: new Date(),
  updatedAt: new Date(),
  update: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const makeFindAndCountAll = (rows: any[], count: number) => ({ rows, count });

const expectPagination = (
  pagination: any,
  expected: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }
) => {
  expect(pagination).toMatchObject(expected);
};

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('RoleService', () => {
  let service: RoleService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RoleService();
  });

  // ─── CREATE ──────────────────────────────────────────────────────────────
  describe('create', () => {
    describe('name validation', () => {
      it.each([
        ['empty string', ''],
        ['whitespace only', '   '],
      ])('should throw BadRequestError — %s', async (_, name) => {
        await expect(service.create({ name, description: 'Test' })).rejects.toThrow(BadRequestError);
      });
    });

    it('should create role with name and description', async () => {
      const dto = { name: 'admin', description: 'Administrator role' };
      const mock = makeRole();
      (Role.findOne as jest.Mock).mockResolvedValue(null);
      (Role.create as jest.Mock).mockResolvedValue(mock);

      const result = await service.create(dto);

      expect(result.id).toBe(1);
      expect(result.name).toBe(dto.name);
      expect(result.description).toBe(dto.description);
      expect(Role.findOne).toHaveBeenCalledWith({ where: { name: dto.name } });
    });

    it('should create role without description (optional field)', async () => {
      const mock = makeRole({ id: 2, name: 'user', description: undefined });
      (Role.findOne as jest.Mock).mockResolvedValue(null);
      (Role.create as jest.Mock).mockResolvedValue(mock);

      const result = await service.create({ name: 'user' });

      expect(result.id).toBe(2);
      expect(result.name).toBe('user');
    });

    it('should throw ConflictError when name already taken', async () => {
      (Role.findOne as jest.Mock).mockResolvedValue(makeRole());
      await expect(service.create({ name: 'admin', description: 'Test' })).rejects.toThrow(ConflictError);
      expect(Role.create).not.toHaveBeenCalled();
    });
  });

  // ─── FIND ALL ─────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return roles with default pagination (page=1, limit=10)', async () => {
      const rows = [makeRole({ id: 1 }), makeRole({ id: 2, name: 'user' })];
      (Role.findAndCountAll as jest.Mock).mockResolvedValue(makeFindAndCountAll(rows, 2));

      const { roles, pagination } = await service.findAll();

      expect(roles).toEqual(rows);
      expectPagination(pagination, { total: 2, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false });
      expect(Role.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 0, limit: 10, order: [['createdAt', 'DESC']] })
      );
    });

    it('should handle custom pagination (page=2, limit=5, total=15)', async () => {
      (Role.findAndCountAll as jest.Mock).mockResolvedValue(makeFindAndCountAll([makeRole()], 15));

      const { pagination } = await service.findAll(2, 5);

      expect(Role.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 5, limit: 5 })
      );
      expectPagination(pagination, { total: 15, page: 2, limit: 5, totalPages: 3, hasNextPage: true, hasPrevPage: true });
    });

    it('should return empty array and zero total when no roles exist', async () => {
      (Role.findAndCountAll as jest.Mock).mockResolvedValue(makeFindAndCountAll([], 0));

      const { roles, pagination } = await service.findAll();

      expect(roles).toEqual([]);
      expect(pagination.total).toBe(0);
      expect(pagination.hasNextPage).toBe(false);
    });
  });

  // ─── FIND BY ID ───────────────────────────────────────────────────────────
  describe('findById', () => {
    it('should return the role when found', async () => {
      const mock = makeRole();
      (Role.findByPk as jest.Mock).mockResolvedValue(mock);

      const result = await service.findById(1);

      expect(result).toEqual(mock);
      expect(Role.findByPk).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundError when role does not exist', async () => {
      (Role.findByPk as jest.Mock).mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundError);
    });
  });

  // ─── FIND BY NAME ─────────────────────────────────────────────────────────
  describe('findByName', () => {
    it('should return the role when found', async () => {
      const mock = makeRole();
      (Role.findOne as jest.Mock).mockResolvedValue(mock);

      const result = await service.findByName('admin');

      expect(result).toEqual(mock);
      expect(Role.findOne).toHaveBeenCalledWith({ where: { name: 'admin' } });
    });

    it('should throw NotFoundError when role does not exist', async () => {
      (Role.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.findByName('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  describe('update', () => {
    let mock: ReturnType<typeof makeRole>;

    beforeEach(() => {
      mock = makeRole();
    });

    it('should update name and verify uniqueness', async () => {
      (Role.findByPk as jest.Mock).mockResolvedValue(mock);
      (Role.findOne as jest.Mock).mockResolvedValue(null);

      await service.update(1, { name: 'super_admin' });

      expect(mock.update).toHaveBeenCalledWith({ name: 'super_admin' });
      expect(Role.findOne).toHaveBeenCalledWith({ where: { name: 'super_admin' } });
    });

    it('should update description without touching name uniqueness check', async () => {
      (Role.findByPk as jest.Mock).mockResolvedValue(mock);

      await service.update(1, { description: 'New description' });

      expect(mock.update).toHaveBeenCalledWith({ description: 'New description' });
    });

    it('should allow keeping the same name (self-reference is not a conflict)', async () => {
      (Role.findByPk as jest.Mock).mockResolvedValue(mock);
      (Role.findOne as jest.Mock).mockResolvedValue(mock); // same id → skip conflict

      await service.update(1, { name: 'admin' });

      expect(mock.update).toHaveBeenCalledWith({ name: 'admin' });
    });

    it('should throw ConflictError when name belongs to a different role', async () => {
      (Role.findByPk as jest.Mock).mockResolvedValue(mock);
      (Role.findOne as jest.Mock).mockResolvedValue(makeRole({ id: 2, name: 'existing_role' }));

      await expect(service.update(1, { name: 'existing_role' })).rejects.toThrow(ConflictError);
      expect(mock.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when role does not exist', async () => {
      (Role.findByPk as jest.Mock).mockResolvedValue(null);
      await expect(service.update(999, { name: 'new_role' })).rejects.toThrow(NotFoundError);
    });

    it('should handle empty DTO (no-op update)', async () => {
      (Role.findByPk as jest.Mock).mockResolvedValue(mock);
      await service.update(1, {});
      expect(mock.update).toHaveBeenCalledWith({});
    });
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('should call destroy on the found role', async () => {
      const mock = makeRole();
      (Role.findByPk as jest.Mock).mockResolvedValue(mock);

      await service.delete(1);

      expect(mock.destroy).toHaveBeenCalled();
    });

    it('should throw NotFoundError when role does not exist', async () => {
      (Role.findByPk as jest.Mock).mockResolvedValue(null);
      await expect(service.delete(999)).rejects.toThrow(NotFoundError);
    });
  });
});