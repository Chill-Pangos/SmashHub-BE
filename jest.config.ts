import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src'],

  // ─── Test matching ──────────────────────────────────────────────────────────
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts',
  ],

  // ─── Module resolution ──────────────────────────────────────────────────────
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // ─── Transform ──────────────────────────────────────────────────────────────
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          resolveJsonModule: true,
        },
      },
    ],
  },

  // ─── Setup ──────────────────────────────────────────────────────────────────
  //
  // setupFiles        : chạy TRƯỚC khi Jest framework được install.
  //                     Dùng cho env vars và jest.mock() cần block module
  //                     side-effects (sequelize-typescript decorators, fs.readFileSync).
  //
  // setupFilesAfterEnv: chạy SAU khi Jest framework được install.
  //                     Dùng cho expect.extend(), jest.setTimeout(), global hooks.
  //
  setupFiles:         ['<rootDir>/jest.preload.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // ─── Mock behavior ──────────────────────────────────────────────────────────
  //
  // clearMocks  : xóa mock.calls và mock.instances giữa mỗi test (KHÔNG xóa implementation)
  // resetMocks  : xóa implementation (mockReturnValue...) — GIỮ false để beforeEach mock còn hiệu lực
  // restoreMocks: khôi phục jest.spyOn về implementation gốc sau mỗi test
  //
  clearMocks:   true,
  resetMocks:   false,
  restoreMocks: true,

  // ─── Coverage ───────────────────────────────────────────────────────────────
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.model.ts',
    '!src/**/*.routes.ts',
    '!src/**/*.middleware.ts',
    '!src/**/*.decorator.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.const.ts',
    '!src/config/**',
    '!src/docs/**',
    '!src/server.ts',
    '!src/app.ts',
  ],
  coverageDirectory:          '<rootDir>/coverage',
  coverageReporters:          ['text', 'lcov', 'html', 'json-summary'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],

  // ─── Ignore patterns ────────────────────────────────────────────────────────
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // ─── Performance & output ───────────────────────────────────────────────────
  testTimeout: 10000,
  maxWorkers:  '50%',
  verbose:     true,
};

export default config;