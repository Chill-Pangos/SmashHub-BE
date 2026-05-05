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
jest.mock('../../services/tournament.service');
jest.mock('../../utils/errors', () => ({
  BadRequestError: class BadRequestError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'BadRequestError';
    }
  },
  NotFoundError: class NotFoundError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NotFoundError';
    }
  },
}));

import { Request, Response, NextFunction } from 'express';
import TournamentController from '../../controllers/tournament.controller';
import tournamentService from '../../services/tournament.service';
import { BadRequestError, NotFoundError } from '../../utils/errors';

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
  categories: [],
  ...overrides,
});

const mockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  user: { id: 1 },
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
describe('TournamentController', () => {
  let controller: any;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = TournamentController;
  });

  // ─── CREATE ──────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create tournament and return 201', async () => {
      const createDto = makeCreateDto();
      const mockTournament = makeTournament({ name: createDto.name });
      const req = mockRequest({ body: createDto, user: { id: 1 } });
      const res = mockResponse();
      const next = mockNext();

      (tournamentService.create as jest.Mock).mockResolvedValue(mockTournament);

      await controller.create(req as Request, res as Response, next);

      expect(tournamentService.create).toHaveBeenCalledWith(
        expect.objectContaining({ ...createDto, createdBy: 1 })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockTournament);
    });

    it('should throw BadRequestError when user not authenticated', async () => {
      const req = mockRequest({ body: makeCreateDto(), user: undefined });
      const res = mockResponse();
      const next = mockNext();

      await controller.create(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should pass error to next when service throws', async () => {
      const req = mockRequest({ body: makeCreateDto(), user: { id: 1 } });
      const res = mockResponse();
      const next = mockNext();
      const error = new Error('Service error');

      (tournamentService.create as jest.Mock).mockRejectedValue(error);

      await controller.create(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── FIND ALL WITH FILTERS ────────────────────────────────────────────────
  describe('findAllWithCategoriesFiltered', () => {
    it('should return tournaments with pagination', async () => {
      const tournaments = [makeTournament(), makeTournament({ id: 2 })];
      const result = {
        tournaments,
        pagination: { total: 2, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false },
      };
      const req = mockRequest({ query: { skip: '0', limit: '10' } });
      const res = mockResponse();
      const next = mockNext();

      (tournamentService.findAllWithCategoriesFiltered as jest.Mock).mockResolvedValue(result);

      await controller.findAllWithCategoriesFiltered(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(result);
    });

    it('should parse query parameters correctly', async () => {
      const result = { tournaments: [], pagination: { total: 0, page: 1, limit: 10 } };
      const req = mockRequest({
        query: {
          skip: '20',
          limit: '5',
          userId: '1',
          createdBy: '2',
          minAge: '18',
          maxAge: '65',
          minElo: '1200',
          maxElo: '2000',
          gender: 'male',
          isGroupStage: 'true',
        },
      });
      const res = mockResponse();
      const next = mockNext();

      (tournamentService.findAllWithCategoriesFiltered as jest.Mock).mockResolvedValue(result);

      await controller.findAllWithCategoriesFiltered(req as Request, res as Response, next);

      expect(tournamentService.findAllWithCategoriesFiltered).toHaveBeenCalledWith({
        skip: 20,
        limit: 5,
        userId: 1,
        createdBy: 2,
        minAge: 18,
        maxAge: 65,
        minElo: 1200,
        maxElo: 2000,
        gender: 'male',
        isGroupStage: true,
      });
    });

    it('should use default limit=10 when not provided', async () => {
      const result = { tournaments: [], pagination: { total: 0, page: 1, limit: 10 } };
      const req = mockRequest({ query: { skip: '0' } });
      const res = mockResponse();
      const next = mockNext();

      (tournamentService.findAllWithCategoriesFiltered as jest.Mock).mockResolvedValue(result);

      await controller.findAllWithCategoriesFiltered(req as Request, res as Response, next);

      expect(tournamentService.findAllWithCategoriesFiltered).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10 })
      );
    });

    it('should handle isGroupStage=false correctly', async () => {
      const result = { tournaments: [], pagination: { total: 0, page: 1, limit: 10 } };
      const req = mockRequest({ query: { isGroupStage: 'false' } });
      const res = mockResponse();
      const next = mockNext();

      (tournamentService.findAllWithCategoriesFiltered as jest.Mock).mockResolvedValue(result);

      await controller.findAllWithCategoriesFiltered(req as Request, res as Response, next);

      expect(tournamentService.findAllWithCategoriesFiltered).toHaveBeenCalledWith(
        expect.objectContaining({ isGroupStage: false })
      );
    });

    it('should pass error to next when service throws', async () => {
      const req = mockRequest({ query: {} });
      const res = mockResponse();
      const next = mockNext();
      const error = new Error('Service error');

      (tournamentService.findAllWithCategoriesFiltered as jest.Mock).mockRejectedValue(error);

      await controller.findAllWithCategoriesFiltered(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── FIND BY ID ───────────────────────────────────────────────────────────
  describe('findById', () => {
    it('should return tournament when found', async () => {
      const mockTournament = makeTournament({ id: 1 });
      const req = mockRequest({ params: { id: '1' } });
      const res = mockResponse();
      const next = mockNext();

      (tournamentService.findById as jest.Mock).mockResolvedValue(mockTournament);

      await controller.findById(req as Request, res as Response, next);

      expect(tournamentService.findById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTournament);
    });

    it('should throw NotFoundError when tournament not found', async () => {
      const req = mockRequest({ params: { id: '999' } });
      const res = mockResponse();
      const next = mockNext();

      (tournamentService.findById as jest.Mock).mockResolvedValue(null);

      await controller.findById(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should throw BadRequestError when id is invalid', async () => {
      const req = mockRequest({ params: { id: 'invalid' } });
      const res = mockResponse();
      const next = mockNext();

      await controller.findById(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(tournamentService.findById).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when id is <= 0', async () => {
      const req = mockRequest({ params: { id: '0' } });
      const res = mockResponse();
      const next = mockNext();

      await controller.findById(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(tournamentService.findById).not.toHaveBeenCalled();
    });
  });

  // ─── FIND BY ID WITH CATEGORIES ──────────────────────────────────────────
  describe('findByIdWithCategories', () => {
    it('should return tournament with categories when found', async () => {
      const mockTournament = makeTournament({ id: 1, categories: [{ id: 1, name: 'Singles' }] });
      const req = mockRequest({ params: { id: '1' } });
      const res = mockResponse();
      const next = mockNext();

      (tournamentService.findByIdWithCategories as jest.Mock).mockResolvedValue(mockTournament);

      await controller.findByIdWithCategories(req as Request, res as Response, next);

      expect(tournamentService.findByIdWithCategories).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTournament);
    });

    it('should throw NotFoundError when tournament not found', async () => {
      const req = mockRequest({ params: { id: '999' } });
      const res = mockResponse();
      const next = mockNext();

      (tournamentService.findByIdWithCategories as jest.Mock).mockResolvedValue(null);

      await controller.findByIdWithCategories(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should throw BadRequestError when id is invalid', async () => {
      const req = mockRequest({ params: { id: 'invalid' } });
      const res = mockResponse();
      const next = mockNext();

      await controller.findByIdWithCategories(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(tournamentService.findByIdWithCategories).not.toHaveBeenCalled();
    });
  });

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  describe('update', () => {
    const updateDto = { name: 'Updated Tournament', startDate: new Date('2024-06-05') };

    it('should update tournament and return 200', async () => {
      const mockTournament = makeTournament({ ...updateDto });
      const req = mockRequest({ params: { id: '1' }, body: updateDto });
      const res = mockResponse();
      const next = mockNext();

      (tournamentService.update as jest.Mock).mockResolvedValue(mockTournament);

      await controller.update(req as Request, res as Response, next);

      expect(tournamentService.update).toHaveBeenCalledWith(1, updateDto);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTournament);
    });

    it('should throw NotFoundError when tournament not found', async () => {
      const req = mockRequest({ params: { id: '999' }, body: updateDto });
      const res = mockResponse();
      const next = mockNext();

      (tournamentService.update as jest.Mock).mockResolvedValue(null);

      await controller.update(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should throw BadRequestError when id is invalid', async () => {
      const req = mockRequest({ params: { id: 'invalid' }, body: updateDto });
      const res = mockResponse();
      const next = mockNext();

      await controller.update(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(tournamentService.update).not.toHaveBeenCalled();
    });
  });

  // ─── UPDATE WITH CATEGORIES ──────────────────────────────────────────────
  describe('updateWithCategories', () => {
    const updateDto = { name: 'Updated Tournament', categories: [{ name: 'Singles', type: 'single', maxEntries: 64, maxSets: 3 }] };

    it('should update tournament with categories and return 200', async () => {
      const mockTournament = makeTournament({ ...updateDto, categories: updateDto.categories });
      const req = mockRequest({ params: { id: '1' }, body: updateDto });
      const res = mockResponse();
      const next = mockNext();

      (tournamentService.update as jest.Mock).mockResolvedValue(mockTournament);

      await controller.updateWithCategories(req as Request, res as Response, next);

      expect(tournamentService.update).toHaveBeenCalledWith(1, updateDto);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTournament);
    });

    it('should throw BadRequestError when id is invalid', async () => {
      const req = mockRequest({ params: { id: 'invalid' }, body: updateDto });
      const res = mockResponse();
      const next = mockNext();

      await controller.updateWithCategories(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('should delete tournament and return 204', async () => {
      const req = mockRequest({ params: { id: '1' } });
      const res = mockResponse();
      const next = mockNext();

      (tournamentService.delete as jest.Mock).mockResolvedValue(1);

      await controller.delete(req as Request, res as Response, next);

      expect(tournamentService.delete).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should throw NotFoundError when tournament not found', async () => {
      const req = mockRequest({ params: { id: '999' } });
      const res = mockResponse();
      const next = mockNext();

      (tournamentService.delete as jest.Mock).mockResolvedValue(0);

      await controller.delete(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should throw BadRequestError when id is invalid', async () => {
      const req = mockRequest({ params: { id: 'invalid' } });
      const res = mockResponse();
      const next = mockNext();

      await controller.delete(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(tournamentService.delete).not.toHaveBeenCalled();
    });
  });

  // ─── UPDATE STATUSES ──────────────────────────────────────────────────────
  describe('updateStatuses', () => {
    it('should update tournament statuses and return 200', async () => {
      const result = { openedCount: 2, closedCount: 1, bracketsGeneratedCount: 0, totalUpdated: 3 };
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();

      (tournamentService.updateTournamentStatuses as jest.Mock).mockResolvedValue(result);

      await controller.updateStatuses(req as Request, res as Response, next);

      expect(tournamentService.updateTournamentStatuses).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Tournament statuses updated successfully',
        data: result,
      });
    });

    it('should pass error to next when service throws', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();
      const error = new Error('Service error');

      (tournamentService.updateTournamentStatuses as jest.Mock).mockRejectedValue(error);

      await controller.updateStatuses(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // ─── GET UPCOMING CHANGES ─────────────────────────────────────────────────
  describe('getUpcomingChanges', () => {
    it('should return upcoming status changes with default 24 hours', async () => {
      const result = { registrationOpening: [], registrationClosing: [], bracketsGenerating: [] };
      const req = mockRequest({ query: {} });
      const res = mockResponse();
      const next = mockNext();

      (tournamentService.getUpcomingStatusChanges as jest.Mock).mockResolvedValue(result);

      await controller.getUpcomingChanges(req as Request, res as Response, next);

      expect(tournamentService.getUpcomingStatusChanges).toHaveBeenCalledWith(24);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: result,
          metadata: expect.objectContaining({ lookAheadHours: 24 }),
        })
      );
    });

    it('should parse custom hours parameter', async () => {
      const result = { registrationOpening: [], registrationClosing: [], bracketsGenerating: [] };
      const req = mockRequest({ query: { hours: '48' } });
      const res = mockResponse();
      const next = mockNext();

      (tournamentService.getUpcomingStatusChanges as jest.Mock).mockResolvedValue(result);

      await controller.getUpcomingChanges(req as Request, res as Response, next);

      expect(tournamentService.getUpcomingStatusChanges).toHaveBeenCalledWith(48);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ lookAheadHours: 48 }),
        })
      );
    });

    it('should include timestamp in response', async () => {
      const result = { registrationOpening: [], registrationClosing: [], bracketsGenerating: [] };
      const req = mockRequest({ query: {} });
      const res = mockResponse();
      const next = mockNext();

      (tournamentService.getUpcomingStatusChanges as jest.Mock).mockResolvedValue(result);

      await controller.getUpcomingChanges(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            timestamp: expect.any(String),
          }),
        })
      );
    });
  });
});
