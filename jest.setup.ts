/**
 * jest.setup.ts — chạy qua `setupFilesAfterEnv` (sau khi Jest framework được install)
 *
 * Dùng cho: custom matchers, global hooks (beforeEach/afterAll), console config.
 * Env vars và jest.mock() phải nằm trong jest.preload.ts.
 */

/// <reference types="jest" />

// ─── CONSOLE ─────────────────────────────────────────────────────────────────

const originalConsole = global.console;

global.console = {
  ...console,
  log:   jest.fn((...args: any[]) => originalConsole.log(...args)),
  debug: jest.fn((...args: any[]) => originalConsole.debug(...args)),
  info:  jest.fn((...args: any[]) => originalConsole.info(...args)),
  // Suppress error/warn noise trong test output
  error: jest.fn(),
  warn:  jest.fn(),
  // Giữ lại các method còn lại
  table:          originalConsole.table,
  dir:            originalConsole.dir,
  time:           originalConsole.time,
  timeEnd:        originalConsole.timeEnd,
  trace:          originalConsole.trace,
  assert:         originalConsole.assert,
  clear:          originalConsole.clear,
  group:          originalConsole.group,
  groupEnd:       originalConsole.groupEnd,
  groupCollapsed: originalConsole.groupCollapsed,
} as any;

// ─── TIMEOUT ─────────────────────────────────────────────────────────────────

jest.setTimeout(10000);

// ─── CUSTOM MATCHERS ─────────────────────────────────────────────────────────

expect.extend({
  toBeValidISODate(received: any) {
    const pass = typeof received === 'string' && !isNaN(Date.parse(received));
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid ISO date string`
          : `Expected ${received} to be a valid ISO date string`,
    };
  },
});

// ─── UNHANDLED REJECTION ─────────────────────────────────────────────────────

process.on('unhandledRejection', (reason, promise) => {
  if (process.env.DEBUG_UNHANDLED_REJECTION) {
    originalConsole.error('Unhandled Rejection at:', promise, 'reason:', reason);
  }
});

// ─── TEARDOWN ────────────────────────────────────────────────────────────────

afterAll(async () => {
  // Thêm cleanup logic tại đây nếu cần (đóng DB connection, clear cache, v.v.)
});

// ─── DEBUG ───────────────────────────────────────────────────────────────────

if (process.env.DEBUG_SETUP) {
  originalConsole.log('✓ Jest setup loaded');
  originalConsole.log(`✓ NODE_ENV: ${process.env.NODE_ENV}`);
  originalConsole.log(`✓ TZ: ${process.env.TZ}`);
}