// Global test setup
// IMPORTANT: Load test environment variables BEFORE any imports
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.test file
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

import { sequelize } from '../src/config/database';

// Mock database connection
jest.mock('../src/config/database', () => ({
  sequelize: {
    transaction: jest.fn(() => ({
      commit: jest.fn(),
      rollback: jest.fn(),
    })),
    authenticate: jest.fn(),
    sync: jest.fn(),
  },
}));

// Setup before all tests
beforeAll(async () => {
  // Environment already configured above
});

// Cleanup after all tests
afterAll(async () => {
  // Close database connections
  // await sequelize.close();
});

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
