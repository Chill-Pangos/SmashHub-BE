// Test helpers and utilities
import jwt from 'jsonwebtoken';

/**
 * Generate a valid JWT token for testing
 */
export const generateTestToken = (userId: number = 1, email: string = 'test@example.com'): string => {
  return jwt.sign(
    { id: userId, email },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

/**
 * Mock user data for testing
 */
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Mock tournament data for testing
 */
export const mockTournament = {
  id: 1,
  name: 'Spring Championship 2026',
  status: 'upcoming',
  startDate: new Date('2026-03-15T09:00:00Z'),
  endDate: new Date('2026-03-20T18:00:00Z'),
  location: 'National Stadium',
  createdBy: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Mock tournament content data for testing
 */
export const mockTournamentContent = {
  id: 1,
  tournamentId: 1,
  name: "Men's Singles",
  type: 'single' as const,
  maxEntries: 32,
  maxSets: 3,
  numberOfSingles: null,
  numberOfDoubles: null,
  minAge: null,
  maxAge: null,
  minElo: null,
  maxElo: null,
  gender: 'male' as const,
  racketCheck: true,
  isGroupStage: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Mock tournament with contents
 */
export const mockTournamentWithContents = {
  ...mockTournament,
  contents: [mockTournamentContent],
};

/**
 * Create mock request data for creating tournament
 */
export const createMockTournamentRequest = (overrides = {}) => ({
  name: 'Spring Championship 2026',
  startDate: '2026-03-15T09:00:00Z',
  endDate: '2026-03-20T18:00:00Z',
  location: 'National Stadium',
  status: 'upcoming',
  contents: [
    {
      name: "Men's Singles",
      type: 'single',
      maxEntries: 32,
      maxSets: 3,
      racketCheck: true,
      gender: 'male',
      isGroupStage: false,
    },
  ],
  ...overrides,
});

/**
 * Create mock request data for team tournament
 */
export const createMockTeamTournamentRequest = (overrides = {}) => ({
  name: 'Team Championship 2026',
  startDate: '2026-05-10T08:00:00Z',
  location: 'Sports Complex',
  contents: [
    {
      name: "Men's Team",
      type: 'team',
      maxEntries: 8,
      maxSets: 3,
      numberOfSingles: 4,
      numberOfDoubles: 1,
      racketCheck: true,
      isGroupStage: true,
    },
  ],
  ...overrides,
});
