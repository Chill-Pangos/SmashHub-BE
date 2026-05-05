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
jest.mock('../../models/tournament.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));
jest.mock('../../models/tournamentCategory.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    bulkCreate: jest.fn(),
  },
}));
jest.mock('../../models/entry.model', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
  },
}));
jest.mock('../../models/entryMember.model', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn(),
  },
}));
jest.mock('../../config/database', () => ({
  sequelize: {
    transaction: jest.fn(),
  },
}));

import Tournament from '../../models/tournament.model';
import TournamentCategory from '../../models/tournamentCategory.model';
import Entry from '../../models/entry.model';
import { TournamentService } from '../../services/tournament.service';
import { sequelize } from '../../config/database';

// ─── Factories ───────────────────────────────────────────────────────────────
const makeTournament = (overrides: Record<string, any> = {}) => ({
  id: 1,
  name: 'Smash Tournament 2024',
  tier: 'regional',
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-06-02'),
  registrationStartDate: new Date('2024-05-01'),
  registrationEndDate: new Date('2024-05-25'),
  bracketGenerationDate: new Date('2024-05-26'),
  location: 'New York',
  status: 'upcoming',
  numberOfTables: 4,
  createdBy: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  categories: [],
  update: jest.fn().mockResolvedValue(undefined),
  destroy: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

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
  ...overrides,
});

const makeCreateDto = (overrides: Record<string, any> = {}) => ({
  name: 'New Tournament',
  tier: 'regional',
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-06-02'),
  registrationStartDate: new Date('2024-05-01'),
  registrationEndDate: new Date('2024-05-25'),
  bracketGenerationDate: new Date('2024-05-26'),
  location: 'New York',
  numberOfTables: 4,
  createdBy: 1,
  categories: [{ name: 'Singles', type: 'single', maxEntries: 64, maxSets: 3, isGroupStage: false }],
  ...overrides,
});

const mockTransaction = {
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
};

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('TournamentService', () => {
  let service: TournamentService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TournamentService();
    (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
  });

  // ─── CREATE ──────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create tournament with categories and commit transaction', async () => {
      const createDto = makeCreateDto();
      const mockTournament = makeTournament({ name: createDto.name, categories: [makeCategory()] });
      (Tournament.create as jest.Mock).mockResolvedValue(makeTournament({ name: createDto.name }));
      (TournamentCategory.bulkCreate as jest.Mock).mockResolvedValue([makeCategory()]);
      (Tournament.findByPk as jest.Mock).mockResolvedValue(mockTournament);

      const result = await service.create(createDto as any);

      expect(result.name).toBe('New Tournament');
      expect(result.categories).toBeDefined();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });

    it('should create tournament without categories and skip bulkCreate', async () => {
      const createDto = makeCreateDto({ categories: [] });
      const mockTournament = makeTournament({ name: createDto.name, categories: [] });
      (Tournament.create as jest.Mock).mockResolvedValue(makeTournament({ name: createDto.name }));
      (Tournament.findByPk as jest.Mock).mockResolvedValue(mockTournament);

      const result = await service.create(createDto as any);

      expect(result).toBeDefined();
      expect(TournamentCategory.bulkCreate).not.toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should throw and rollback when categories exceed limit (>1)', async () => {
      (Tournament.create as jest.Mock).mockResolvedValue(makeTournament());

      await expect(
        service.create(makeCreateDto({ categories: [makeCategory(), makeCategory({ id: 2 })] }) as any)
      ).rejects.toThrow('A tournament can have at most 1 categories');

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });

    it('should throw and rollback on unexpected DB error', async () => {
      (Tournament.create as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.create(makeCreateDto() as any)).rejects.toThrow('DB error');

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });

    it('should use default status "upcoming" when status not provided', async () => {
      const createDto = makeCreateDto();
      const mockTournament = makeTournament({ status: 'upcoming', name: createDto.name });
      (Tournament.create as jest.Mock).mockResolvedValue(makeTournament({ status: 'upcoming', name: createDto.name }));
      (Tournament.findByPk as jest.Mock).mockResolvedValue(mockTournament);

      await service.create(createDto as any);

      expect(Tournament.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'upcoming' }),
        expect.anything()
      );
    });

    it('should use default numberOfTables=1 when not provided', async () => {
      const createDto = makeCreateDto({ numberOfTables: undefined });
      const mockTournament = makeTournament({ name: createDto.name });
      (Tournament.create as jest.Mock).mockResolvedValue(makeTournament({ name: createDto.name }));
      (Tournament.findByPk as jest.Mock).mockResolvedValue(mockTournament);

      await service.create(createDto as any);

      expect(Tournament.create).toHaveBeenCalledWith(
        expect.objectContaining({ numberOfTables: 1 }),
        expect.anything()
      );
    });
  });

  // ─── FIND ALL WITH FILTERS ────────────────────────────────────────────────
  describe('findAllWithCategoriesFiltered', () => {
    beforeEach(() => {
      (Tournament.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [makeTournament(), makeTournament({ id: 2 })],
        count: 2,
      });
    });

    it('should return tournaments with default pagination', async () => {
      const { tournaments, pagination } = await service.findAllWithCategoriesFiltered({ limit: 10 });

      expect(tournaments).toHaveLength(2);
      expect(pagination).toMatchObject({ total: 2, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false });
    });

    it('should derive page from skip and limit (skip=10, limit=5 → page=3)', async () => {
      (Tournament.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [makeTournament()], count: 15 });

      const { pagination } = await service.findAllWithCategoriesFiltered({ skip: 10, limit: 5 });

      expect(pagination).toMatchObject({ page: 3, limit: 5, totalPages: 3, hasNextPage: false, hasPrevPage: true });
    });

    it('should return empty list when no tournaments match filters', async () => {
      (Tournament.findAndCountAll as jest.Mock).mockResolvedValue({ rows: [], count: 0 });

      const { tournaments, pagination } = await service.findAllWithCategoriesFiltered({ limit: 10, createdBy: 999 });

      expect(tournaments).toEqual([]);
      expect(pagination).toMatchObject({ total: 0, hasNextPage: false, hasPrevPage: false });
    });

    it('should pass createdBy to Tournament.findAndCountAll query', async () => {
      await service.findAllWithCategoriesFiltered({ limit: 10, createdBy: 1 });

      expect(Tournament.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ createdBy: 1 }) })
      );
    });

    it('should return empty when category filters match no tournaments', async () => {
      (TournamentCategory.findAll as jest.Mock).mockResolvedValue([]); // no matching categories

      const { tournaments, pagination } = await service.findAllWithCategoriesFiltered({ limit: 10, minAge: 18 });

      expect(tournaments).toEqual([]);
      expect(pagination.total).toBe(0);
      expect(Tournament.findAndCountAll).not.toHaveBeenCalled();
    });

    it('should filter tournaments by age range via category lookup', async () => {
      (TournamentCategory.findAll as jest.Mock).mockResolvedValue([makeCategory({ tournamentId: 1 })]);

      const { tournaments } = await service.findAllWithCategoriesFiltered({ limit: 10, minAge: 18, maxAge: 65 });

      expect(Tournament.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: expect.anything() }) })
      );
      expect(tournaments).toHaveLength(2);
    });

    it('should filter tournaments by elo range via category lookup', async () => {
      (TournamentCategory.findAll as jest.Mock).mockResolvedValue([makeCategory({ tournamentId: 1 })]);

      const { tournaments } = await service.findAllWithCategoriesFiltered({ limit: 10, minElo: 1200, maxElo: 2000 });

      expect(tournaments).toHaveLength(2);
    });

    it('should return empty when userId has no entries', async () => {
      (Entry.findAll as jest.Mock).mockResolvedValue([]);

      const { tournaments, pagination } = await service.findAllWithCategoriesFiltered({ limit: 10, userId: 999 });

      expect(tournaments).toEqual([]);
      expect(pagination.total).toBe(0);
      expect(Tournament.findAndCountAll).not.toHaveBeenCalled();
    });

    it('should filter by userId via entry → category → tournament chain', async () => {
      (Entry.findAll as jest.Mock).mockResolvedValue([{ categoryId: 1, members: [{ userId: 1 }] }]);
      (TournamentCategory.findAll as jest.Mock).mockResolvedValue([makeCategory({ tournamentId: 1 })]);

      const { tournaments } = await service.findAllWithCategoriesFiltered({ limit: 10, userId: 1 });

      expect(tournaments).toHaveLength(2);
    });
  });

  // ─── FIND BY ID ───────────────────────────────────────────────────────────
  describe('findById', () => {
    it('should return tournament with categories when found', async () => {
      const mockTournament = makeTournament({ categories: [makeCategory()] });
      (Tournament.findByPk as jest.Mock).mockResolvedValue(mockTournament);

      const result = await service.findById(1);

      expect(result?.id).toBe(1);
      expect(result?.categories).toBeDefined();
      expect(Tournament.findByPk).toHaveBeenCalledWith(1, expect.objectContaining({
        include: expect.arrayContaining([expect.objectContaining({ as: 'categories' })]),
      }));
    });

    it('should return null when tournament not found', async () => {
      (Tournament.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  // ─── FIND BY ID WITH CATEGORIES ──────────────────────────────────────────
  describe('findByIdWithCategories', () => {
    it('should return tournament with all categories', async () => {
      const mockTournament = makeTournament({ categories: [makeCategory(), makeCategory({ id: 2 })] });
      (Tournament.findByPk as jest.Mock).mockResolvedValue(mockTournament);

      const result = await service.findByIdWithCategories(1);

      expect(result?.categories?.length).toBe(2);
    });

    it('should return null when tournament not found', async () => {
      (Tournament.findByPk as jest.Mock).mockResolvedValue(null);

      expect(await service.findByIdWithCategories(999)).toBeNull();
    });
  });

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  describe('update', () => {
    const updateDto = { name: 'Updated Tournament', startDate: new Date('2024-06-05'), endDate: new Date('2024-06-06') };

    it('should update tournament and commit transaction', async () => {
      const mockTournament = makeTournament();
      (Tournament.findByPk as jest.Mock)
        .mockResolvedValueOnce(mockTournament)
        .mockResolvedValueOnce({ ...mockTournament, ...updateDto });

      const result = await service.update(1, updateDto as any);

      expect(result).toBeDefined();
      expect(mockTournament.update).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });

    it('should return null and rollback when tournament not found', async () => {
      (Tournament.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await service.update(999, updateDto as any);

      expect(result).toBeNull();
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });

    it('should throw and rollback when categories exceed limit (>1)', async () => {
      (Tournament.findByPk as jest.Mock).mockResolvedValue(makeTournament());

      await expect(
        service.update(1, { ...updateDto, categories: [makeCategory(), makeCategory({ id: 2 })] } as any)
      ).rejects.toThrow('Currently only 1 category per tournament is allowed');

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });

    it('should replace categories when provided: destroy old then bulkCreate new', async () => {
      const mockTournament = makeTournament();
      (Tournament.findByPk as jest.Mock)
        .mockResolvedValueOnce(mockTournament)
        .mockResolvedValueOnce(mockTournament);
      (TournamentCategory.destroy as jest.Mock).mockResolvedValue(1);
      (TournamentCategory.bulkCreate as jest.Mock).mockResolvedValue([makeCategory()]);

      await service.update(1, { ...updateDto, categories: [makeCategory()] } as any);

      expect(TournamentCategory.destroy).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tournamentId: 1 } })
      );
      expect(TournamentCategory.bulkCreate).toHaveBeenCalled();
    });

    it('should only destroy categories when provided as empty array', async () => {
      const mockTournament = makeTournament();
      (Tournament.findByPk as jest.Mock)
        .mockResolvedValueOnce(mockTournament)
        .mockResolvedValueOnce(mockTournament);
      (TournamentCategory.destroy as jest.Mock).mockResolvedValue(1);

      await service.update(1, { ...updateDto, categories: [] } as any);

      expect(TournamentCategory.destroy).toHaveBeenCalled();
      expect(TournamentCategory.bulkCreate).not.toHaveBeenCalled();
    });

    it('should not touch categories when categories field is undefined', async () => {
      const mockTournament = makeTournament();
      (Tournament.findByPk as jest.Mock)
        .mockResolvedValueOnce(mockTournament)
        .mockResolvedValueOnce(mockTournament);

      await service.update(1, updateDto as any);

      expect(TournamentCategory.destroy).not.toHaveBeenCalled();
      expect(TournamentCategory.bulkCreate).not.toHaveBeenCalled();
    });
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('should delete tournament and return affected row count', async () => {
      (Tournament.destroy as jest.Mock).mockResolvedValue(1);

      const result = await service.delete(1);

      expect(result).toBe(1);
      expect(Tournament.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return 0 when tournament not found', async () => {
      (Tournament.destroy as jest.Mock).mockResolvedValue(0);

      expect(await service.delete(999)).toBe(0);
    });
  });

  // ─── UPDATE TOURNAMENT STATUSES ──────────────────────────────────────────
  describe('updateTournamentStatuses', () => {
    // Service calls Tournament.update 6 times total:
    // 1) upcoming → registration_open
    // 2) registration_open → registration_closed
    // 3) registration_closed → brackets_generated
    // 4) skip upcoming → registration_closed
    // 5) skip * → brackets_generated
    const mockCounts = (...counts: number[]) =>
      counts.forEach((n) => (Tournament.update as jest.Mock).mockResolvedValueOnce([n, []]));

    it('should update upcoming → registration_open and return openedCount', async () => {
      mockCounts(3, 0, 0, 0, 0);

      const result = await service.updateTournamentStatuses();

      expect(result.openedCount).toBe(3);
      expect(result.closedCount).toBe(0);
      expect(result.bracketsGeneratedCount).toBe(0);
      expect(result.totalUpdated).toBe(3);
    });

    it('should accumulate counts across multiple status transitions', async () => {
      mockCounts(2, 1, 1, 0, 0);

      const result = await service.updateTournamentStatuses();

      expect(result.openedCount).toBe(2);
      expect(result.closedCount).toBe(1);
      expect(result.bracketsGeneratedCount).toBe(1);
      expect(result.totalUpdated).toBe(4);
    });

    it('should accumulate closedCount from both direct and skip transitions', async () => {
      mockCounts(0, 1, 0, 2, 0);

      const result = await service.updateTournamentStatuses();

      // closedCount = direct(1) + skip(2) = 3
      expect(result.closedCount).toBe(3);
      expect(result.totalUpdated).toBe(3);
    });

    it('should accumulate bracketsGeneratedCount from both direct and skip transitions', async () => {
      mockCounts(0, 0, 1, 0, 3);

      const result = await service.updateTournamentStatuses();

      // bracketsGeneratedCount = direct(1) + skip(3) = 4
      expect(result.bracketsGeneratedCount).toBe(4);
      expect(result.totalUpdated).toBe(4);
    });

    it('should return all zeros when no tournaments need updates', async () => {
      mockCounts(0, 0, 0, 0, 0);

      const result = await service.updateTournamentStatuses();

      expect(result).toEqual({ openedCount: 0, closedCount: 0, bracketsGeneratedCount: 0, totalUpdated: 0 });
    });

    it('should call Tournament.update 5 times (one per status transition)', async () => {
      mockCounts(0, 0, 0, 0, 0);

      await service.updateTournamentStatuses();

      expect(Tournament.update).toHaveBeenCalledTimes(5);
    });
  });
});