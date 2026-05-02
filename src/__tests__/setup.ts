// Jest setup file
// Bạn có thể thêm cấu hình toàn cục cho tất cả tests ở đây

// Tắt cảnh báo console trong tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

// Đặt timezone cho tất cả tests
process.env.TZ = 'UTC';
