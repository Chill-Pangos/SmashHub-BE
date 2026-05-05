// ─── Env Setup ───────────────────────────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.HOST = 'localhost';
process.env.JWT_SECRET = 'test_secret_very_long_string_for_jwt_secret_minimum_32_chars';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_very_long_string_for_jwt_refresh_secret_minimum_32_chars';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_USERNAME = 'root';
process.env.DB_PASSWORD = 'password';
process.env.DB_DATABASE = 'test_db';
process.env.DB_SSL_CA_PATH = '/path/to/ca.pem';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASSWORD = 'password';
process.env.SMTP_FROM_EMAIL = 'noreply@test.com';
process.env.SMTP_FROM_NAME = 'Test';

jest.mock('sequelize-typescript', () => ({
  Sequelize: jest.fn().mockImplementation(() => ({
    transaction: jest.fn(),
    authenticate: jest.fn(),
    define: jest.fn(),
    query: jest.fn(),
  })),
  Table: () => () => {},
  Column: () => () => {},
  Model: class {},
  DataType: {
    INTEGER: { UNSIGNED: 'INTEGER UNSIGNED' },
    STRING: jest.fn((n) => `STRING(${n})`),
    BOOLEAN: 'BOOLEAN',
    DATE: 'DATE',
    DECIMAL: jest.fn((p, s) => `DECIMAL(${p}, ${s})`),
    ENUM: jest.fn((...values) => `ENUM(${values.join(', ')})`),
    TEXT: 'TEXT',
  },
  HasMany: () => () => {},
  HasOne: () => () => {},
  BelongsTo: () => () => {},
  ForeignKey: () => () => {},
  BelongsToMany: () => () => {},
  PrimaryKey: () => () => {},
  AllowNull: () => () => {},
  Default: () => () => {},
  Unique: () => () => {},
  CreatedAt: () => () => {},
  UpdatedAt: () => () => {},
  BeforeValidate: () => () => {},
  AfterValidate: () => () => {},
  BeforeCreate: () => () => {},
  AfterCreate: () => () => {},
  BeforeUpdate: () => () => {},
  AfterUpdate: () => () => {},
}));
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn().mockReturnValue('mock-ca-cert'),
}));
jest.mock('../../models/tournamentCategory.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));
jest.mock('../../models/tournament.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));

import TournamentCategory from '../../models/tournamentCategory.model';
import { TournamentCategoryService } from '../../services/tournamentCategory.service';

// ─── Factories ───────────────────────────────────────────────────────────────
const makeCategory = (overrides: Record<string, any> = {}) => ({
  id: 1,
  tournamentId: 1,
  name: 'Singles',
  type: 'single',
  maxEntries: 64,
  maxSets: 3,
  teamFormat: null,
  minAge: 18,
  maxAge: 65,
  minElo: 1200,
  maxElo: 2000,
  maxMembersPerEntry: 1,
  gender: 'male',
  isGroupStage: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  update: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const makeCreateDto = (overrides: Record<string, any> = {}) => ({
  tournamentId: 1,
  name: 'Singles',
  type: 'single',
  maxEntries: 64,
  maxSets: 3,
  isGroupStage: false,
  ...overrides,
});

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('TournamentCategoryService', () => {
  let service: TournamentCategoryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TournamentCategoryService();
  });

  // ─── CREATE ──────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create category and return it', async () => {
      const mock = makeCategory();
      (TournamentCategory.create as jest.Mock).mockResolvedValue(mock);
      const dto = makeCreateDto();

      const result = await service.create(dto as any);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Singles');
      expect(TournamentCategory.create).toHaveBeenCalledWith(dto);
    });

    it('should create category without gender', async () => {
      (TournamentCategory.create as jest.Mock).mockResolvedValue(makeCategory({ gender: undefined }));

      const result = await service.create(makeCreateDto({ gender: undefined }) as any);

      expect(result.gender).toBeUndefined();
    });

    it('should create category with null gender', async () => {
      (TournamentCategory.create as jest.Mock).mockResolvedValue(makeCategory({ gender: null }));

      const result = await service.create(makeCreateDto({ type: 'double', gender: null }) as any);

      expect(result.gender).toBeNull();
    });

    // Gender validation — mixed is only allowed for double type
    describe('gender validation', () => {
      it.each(['single', 'team'])(
        'should throw when gender=mixed and type="%s"',
        async (type) => {
          await expect(
            service.create(makeCreateDto({ type, gender: 'mixed' }) as any)
          ).rejects.toThrow('Only double type category can have mixed gender');

          expect(TournamentCategory.create).not.toHaveBeenCalled();
        }
      );

      it('should allow gender=mixed when type=double', async () => {
        const mock = makeCategory({ type: 'double', gender: 'mixed' });
        (TournamentCategory.create as jest.Mock).mockResolvedValue(mock);

        const result = await service.create(makeCreateDto({ type: 'double', gender: 'mixed' }) as any);

        expect(result.gender).toBe('mixed');
        expect(result.type).toBe('double');
      });

      it.each(['male', 'female'])('should allow gender="%s" with any type', async (gender) => {
        const mock = makeCategory({ gender });
        (TournamentCategory.create as jest.Mock).mockResolvedValue(mock);

        const result = await service.create(makeCreateDto({ gender }) as any);

        expect(result.gender).toBe(gender);
      });
    });
  });

  // ─── FIND ALL ─────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return categories with default pagination (skip=0, limit=10)', async () => {
      const mocks = [makeCategory({ id: 1 }), makeCategory({ id: 2, name: 'Doubles' })];
      (TournamentCategory.findAll as jest.Mock).mockResolvedValue(mocks);

      const result = await service.findAll();

      expect(result).toEqual(mocks);
      expect(TournamentCategory.findAll).toHaveBeenCalledWith({ offset: 0, limit: 10 });
    });

    it('should pass custom skip and limit', async () => {
      (TournamentCategory.findAll as jest.Mock).mockResolvedValue([makeCategory()]);

      await service.findAll(20, 5);

      expect(TournamentCategory.findAll).toHaveBeenCalledWith({ offset: 20, limit: 5 });
    });

    it('should return empty array when no categories exist', async () => {
      (TournamentCategory.findAll as jest.Mock).mockResolvedValue([]);

      expect(await service.findAll()).toEqual([]);
    });
  });

  // ─── FIND BY ID ───────────────────────────────────────────────────────────
  describe('findById', () => {
    it('should return category when found', async () => {
      const mock = makeCategory({ id: 5 });
      (TournamentCategory.findByPk as jest.Mock).mockResolvedValue(mock);

      const result = await service.findById(5);

      expect(result).toEqual(mock);
      expect(TournamentCategory.findByPk).toHaveBeenCalledWith(5);
    });

    it('should return null when category not found', async () => {
      (TournamentCategory.findByPk as jest.Mock).mockResolvedValue(null);

      expect(await service.findById(999)).toBeNull();
    });
  });

  // ─── FIND BY TOURNAMENT ID ────────────────────────────────────────────────
  describe('findByTournamentId', () => {
    it('should return categories with default pagination (skip=0, limit=10)', async () => {
      const mocks = [makeCategory({ tournamentId: 1 }), makeCategory({ id: 2, tournamentId: 1, name: 'Doubles' })];
      (TournamentCategory.findAll as jest.Mock).mockResolvedValue(mocks);

      const result = await service.findByTournamentId(1);

      expect(result).toEqual(mocks);
      expect(TournamentCategory.findAll).toHaveBeenCalledWith({ where: { tournamentId: 1 }, offset: 0, limit: 10 });
    });

    it('should pass custom skip and limit', async () => {
      (TournamentCategory.findAll as jest.Mock).mockResolvedValue([makeCategory()]);

      await service.findByTournamentId(1, 10, 5);

      expect(TournamentCategory.findAll).toHaveBeenCalledWith({ where: { tournamentId: 1 }, offset: 10, limit: 5 });
    });

    it('should return empty array when tournament has no categories', async () => {
      (TournamentCategory.findAll as jest.Mock).mockResolvedValue([]);

      expect(await service.findByTournamentId(999)).toEqual([]);
    });
  });

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  describe('update', () => {
    let mockCategory: ReturnType<typeof makeCategory>;

    beforeEach(() => {
      mockCategory = makeCategory();
      (TournamentCategory.findByPk as jest.Mock).mockResolvedValue(mockCategory);
    });

    it('should update category and return [affectedCount, updatedRows]', async () => {
      (TournamentCategory.update as jest.Mock).mockResolvedValue([1, [mockCategory]]);

      const result = await service.update(1, { name: 'Updated Singles' } as any);

      expect(result).toEqual([1, [mockCategory]]);
      expect(TournamentCategory.update).toHaveBeenCalledWith(
        { name: 'Updated Singles' },
        { where: { id: 1 }, returning: true }
      );
    });

    it('should handle partial updates (single field)', async () => {
      (TournamentCategory.update as jest.Mock).mockResolvedValue([1, [mockCategory]]);

      const result = await service.update(1, { maxEntries: 128 } as any);

      expect(result).toBeDefined();
    });

    it('should throw "Category not found" when category does not exist', async () => {
      (TournamentCategory.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(service.update(999, { name: 'New Name' } as any)).rejects.toThrow('Category not found');
      expect(TournamentCategory.update).not.toHaveBeenCalled();
    });

    // Gender/type validation during update
    describe('gender validation', () => {
      it('should throw when updating to type=single with existing gender=mixed', async () => {
        (TournamentCategory.findByPk as jest.Mock).mockResolvedValue(
          makeCategory({ type: 'double', gender: 'mixed' })
        );

        await expect(
          service.update(1, { type: 'single' } as any)
        ).rejects.toThrow('Only double type category can have mixed gender');

        expect(TournamentCategory.update).not.toHaveBeenCalled();
      });

      it('should throw when updating to gender=mixed with existing type=single', async () => {
        await expect(
          service.update(1, { type: 'single', gender: 'mixed' } as any)
        ).rejects.toThrow('Only double type category can have mixed gender');

        expect(TournamentCategory.update).not.toHaveBeenCalled();
      });

      it('should allow updating gender=mixed when type is or becomes double', async () => {
        (TournamentCategory.findByPk as jest.Mock).mockResolvedValue(makeCategory({ type: 'double', gender: 'male' }));
        (TournamentCategory.update as jest.Mock).mockResolvedValue([1, [makeCategory({ type: 'double', gender: 'mixed' })]]);

        const result = await service.update(1, { gender: 'mixed' } as any);

        expect(result).toBeDefined();
        expect(TournamentCategory.update).toHaveBeenCalled();
      });

      it('should allow updating type=double even when current gender=mixed', async () => {
        (TournamentCategory.findByPk as jest.Mock).mockResolvedValue(makeCategory({ type: 'double', gender: 'mixed' }));
        (TournamentCategory.update as jest.Mock).mockResolvedValue([1, [makeCategory({ type: 'double', gender: 'mixed' })]]);

        // Updating something unrelated should not throw
        const result = await service.update(1, { maxEntries: 32 } as any);

        expect(result).toBeDefined();
      });
    });
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('should delete category and return affected row count', async () => {
      (TournamentCategory.destroy as jest.Mock).mockResolvedValue(1);

      const result = await service.delete(1);

      expect(result).toBe(1);
      expect(TournamentCategory.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return 0 when category not found', async () => {
      (TournamentCategory.destroy as jest.Mock).mockResolvedValue(0);

      expect(await service.delete(999)).toBe(0);
    });
  });
});