// ─── Env Setup ───────────────────────────────────────────────────────────────
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_very_long_string_for_jwt_secret_minimum_32_chars';

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
jest.mock('../../services/tournamentCategory.service');
jest.mock('../../utils/errors', () => ({
  NotFoundError: class NotFoundError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NotFoundError';
    }
  },
}));

import { Request, Response, NextFunction } from 'express';
import TournamentCategoryController from '../../controllers/tournamentCategory.controller';
import TournamentCategoryService from '../../services/tournamentCategory.service';
import { NotFoundError } from '../../utils/errors';

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

const mockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  body: {},
  query: {},
  params: {},
  ...overrides,
});

const mockResponse = (): Partial<Response> => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
});

const mockNext = (): NextFunction => jest.fn();

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('TournamentCategoryController', () => {
  let controller: any;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = TournamentCategoryController;
  });

  // ─── CREATE ──────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create category and return 201', async () => {
      const createDto = makeCreateDto();
      const mockCategory = makeCategory();
      const req = mockRequest({ body: createDto });
      const res = mockResponse();
      const next = mockNext();

      (TournamentCategoryService.create as jest.Mock).mockResolvedValue(mockCategory);

      await controller.create(req as Request, res as Response, next);

      expect(TournamentCategoryService.create).toHaveBeenCalledWith(createDto);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCategory);
    });

    it('should pass error to next when service throws', async () => {
      const req = mockRequest({ body: makeCreateDto() });
      const res = mockResponse();
      const next = mockNext();
      const error = new Error('Service error');

      (TournamentCategoryService.create as jest.Mock).mockRejectedValue(error);

      await controller.create(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle validation errors from service', async () => {
      const req = mockRequest({ body: makeCreateDto({ type: 'single', gender: 'mixed' }) });
      const res = mockResponse();
      const next = mockNext();
      const error = new Error('Only double type category can have mixed gender');

      (TournamentCategoryService.create as jest.Mock).mockRejectedValue(error);

      await controller.create(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── FIND ALL ─────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return categories with default pagination', async () => {
      const categories = [makeCategory(), makeCategory({ id: 2, name: 'Doubles' })];
      const req = mockRequest({ query: {} });
      const res = mockResponse();
      const next = mockNext();

      (TournamentCategoryService.findAll as jest.Mock).mockResolvedValue(categories);

      await controller.findAll(req as Request, res as Response, next);

      expect(TournamentCategoryService.findAll).toHaveBeenCalledWith(0, 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(categories);
    });

    it('should parse skip and limit from query', async () => {
      const categories = [makeCategory()];
      const req = mockRequest({ query: { skip: '20', limit: '5' } });
      const res = mockResponse();
      const next = mockNext();

      (TournamentCategoryService.findAll as jest.Mock).mockResolvedValue(categories);

      await controller.findAll(req as Request, res as Response, next);

      expect(TournamentCategoryService.findAll).toHaveBeenCalledWith(20, 5);
    });

    it('should return empty array when no categories exist', async () => {
      const req = mockRequest({ query: { skip: '0', limit: '10' } });
      const res = mockResponse();
      const next = mockNext();

      (TournamentCategoryService.findAll as jest.Mock).mockResolvedValue([]);

      await controller.findAll(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should pass error to next when service throws', async () => {
      const req = mockRequest({ query: {} });
      const res = mockResponse();
      const next = mockNext();
      const error = new Error('Service error');

      (TournamentCategoryService.findAll as jest.Mock).mockRejectedValue(error);

      await controller.findAll(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── FIND BY ID ───────────────────────────────────────────────────────────
  describe('findById', () => {
    it('should return category when found', async () => {
      const mockCategory = makeCategory({ id: 5 });
      const req = mockRequest({ params: { id: '5' } });
      const res = mockResponse();
      const next = mockNext();

      (TournamentCategoryService.findById as jest.Mock).mockResolvedValue(mockCategory);

      await controller.findById(req as Request, res as Response, next);

      expect(TournamentCategoryService.findById).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCategory);
    });

    it('should throw NotFoundError when category not found', async () => {
      const req = mockRequest({ params: { id: '999' } });
      const res = mockResponse();
      const next = mockNext();

      (TournamentCategoryService.findById as jest.Mock).mockResolvedValue(null);

      await controller.findById(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle invalid ID gracefully', async () => {
      const req = mockRequest({ params: { id: 'invalid' } });
      const res = mockResponse();
      const next = mockNext();

      await controller.findById(req as Request, res as Response, next);

      // Service receives NaN, which it should handle
      expect(TournamentCategoryService.findById).toHaveBeenCalledWith(NaN);
    });
  });

  // ─── FIND BY TOURNAMENT ID ────────────────────────────────────────────────
  describe('findByTournamentId', () => {
    it('should return categories for tournament with default pagination', async () => {
      const categories = [makeCategory({ tournamentId: 1 }), makeCategory({ id: 2, tournamentId: 1, name: 'Doubles' })];
      const req = mockRequest({ params: { tournamentId: '1' }, query: {} });
      const res = mockResponse();
      const next = mockNext();

      (TournamentCategoryService.findByTournamentId as jest.Mock).mockResolvedValue(categories);

      await controller.findByTournamentId(req as Request, res as Response, next);

      expect(TournamentCategoryService.findByTournamentId).toHaveBeenCalledWith(1, 0, 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(categories);
    });

    it('should parse skip and limit from query', async () => {
      const categories = [makeCategory({ tournamentId: 1 })];
      const req = mockRequest({ params: { tournamentId: '1' }, query: { skip: '10', limit: '5' } });
      const res = mockResponse();
      const next = mockNext();

      (TournamentCategoryService.findByTournamentId as jest.Mock).mockResolvedValue(categories);

      await controller.findByTournamentId(req as Request, res as Response, next);

      expect(TournamentCategoryService.findByTournamentId).toHaveBeenCalledWith(1, 10, 5);
    });

    it('should return empty array when tournament has no categories', async () => {
      const req = mockRequest({ params: { tournamentId: '999' }, query: {} });
      const res = mockResponse();
      const next = mockNext();

      (TournamentCategoryService.findByTournamentId as jest.Mock).mockResolvedValue([]);

      await controller.findByTournamentId(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should pass error to next when service throws', async () => {
      const req = mockRequest({ params: { tournamentId: '1' }, query: {} });
      const res = mockResponse();
      const next = mockNext();
      const error = new Error('Service error');

      (TournamentCategoryService.findByTournamentId as jest.Mock).mockRejectedValue(error);

      await controller.findByTournamentId(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  describe('update', () => {
    const updateDto = { name: 'Updated Singles', maxEntries: 128 };

    it('should update category and return 200', async () => {
      const mockCategory = makeCategory({ ...updateDto });
      const req = mockRequest({ params: { id: '1' }, body: updateDto });
      const res = mockResponse();
      const next = mockNext();

      (TournamentCategoryService.update as jest.Mock).mockResolvedValue([1, [mockCategory]]);

      await controller.update(req as Request, res as Response, next);

      expect(TournamentCategoryService.update).toHaveBeenCalledWith(1, updateDto);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([1, [mockCategory]]);
    });

    it('should throw NotFoundError when category not found', async () => {
      const req = mockRequest({ params: { id: '999' }, body: updateDto });
      const res = mockResponse();
      const next = mockNext();

      (TournamentCategoryService.update as jest.Mock).mockResolvedValue(null);

      await controller.update(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle partial updates', async () => {
      const partialDto = { maxEntries: 128 };
      const mockCategory = makeCategory(partialDto);
      const req = mockRequest({ params: { id: '1' }, body: partialDto });
      const res = mockResponse();
      const next = mockNext();

      (TournamentCategoryService.update as jest.Mock).mockResolvedValue([1, [mockCategory]]);

      await controller.update(req as Request, res as Response, next);

      expect(TournamentCategoryService.update).toHaveBeenCalledWith(1, partialDto);
    });

    it('should handle validation errors from service', async () => {
      const req = mockRequest({ params: { id: '1' }, body: { type: 'single', gender: 'mixed' } });
      const res = mockResponse();
      const next = mockNext();
      const error = new Error('Only double type category can have mixed gender');

      (TournamentCategoryService.update as jest.Mock).mockRejectedValue(error);

      await controller.update(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('should delete category and return 204', async () => {
      const req = mockRequest({ params: { id: '1' } });
      const res = mockResponse();
      const next = mockNext();

      (TournamentCategoryService.delete as jest.Mock).mockResolvedValue(1);

      await controller.delete(req as Request, res as Response, next);

      expect(TournamentCategoryService.delete).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should throw NotFoundError when category not found', async () => {
      const req = mockRequest({ params: { id: '999' } });
      const res = mockResponse();
      const next = mockNext();

      (TournamentCategoryService.delete as jest.Mock).mockResolvedValue(0);

      await controller.delete(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle service errors', async () => {
      const req = mockRequest({ params: { id: '1' } });
      const res = mockResponse();
      const next = mockNext();
      const error = new Error('Service error');

      (TournamentCategoryService.delete as jest.Mock).mockRejectedValue(error);

      await controller.delete(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── INTEGRATION SCENARIOS ─────────────────────────────────────────────────
  describe('Integration Scenarios', () => {
    it('should handle gender validation in create', async () => {
      const createDto = makeCreateDto({ type: 'single', gender: 'mixed' });
      const req = mockRequest({ body: createDto });
      const res = mockResponse();
      const next = mockNext();
      const error = new Error('Only double type category can have mixed gender');

      (TournamentCategoryService.create as jest.Mock).mockRejectedValue(error);

      await controller.create(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    it('should handle category not found in update', async () => {
      const req = mockRequest({ params: { id: '999' }, body: { name: 'New Name' } });
      const res = mockResponse();
      const next = mockNext();

      (TournamentCategoryService.update as jest.Mock).mockResolvedValue(null);

      await controller.update(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle multiple categories retrieval by tournament', async () => {
      const categories = [
        makeCategory({ id: 1, name: 'Singles' }),
        makeCategory({ id: 2, name: 'Doubles', type: 'double' }),
        makeCategory({ id: 3, name: 'Teams', type: 'team' }),
      ];
      const req = mockRequest({ params: { tournamentId: '1' }, query: { skip: '0', limit: '10' } });
      const res = mockResponse();
      const next = mockNext();

      (TournamentCategoryService.findByTournamentId as jest.Mock).mockResolvedValue(categories);

      await controller.findByTournamentId(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith(categories);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ name: 'Singles' }),
        expect.objectContaining({ name: 'Doubles' }),
        expect.objectContaining({ name: 'Teams' }),
      ]));
    });
  });
});
