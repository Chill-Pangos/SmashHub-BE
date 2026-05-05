/**
 * jest.preload.ts — chạy qua `setupFiles` (trước khi Jest framework được install)
 *
 * Dùng cho:
 *   1. Environment variables (phải có trước khi config.ts validate)
 *   2. Module-level mocks (jest.mock) cho các module chạy side-effect khi import:
 *      - sequelize-typescript : decorator validation (@Table, @Column...) chạy ngay khi class được define
 *      - fs                   : database.ts gọi readFileSync để đọc SSL cert ngay lúc module load
 *
 * KHÔNG dùng expect, beforeEach, afterAll ở đây — Jest chưa được init.
 */

// ─── 1. ENV VARS ─────────────────────────────────────────────────────────────

process.env.TZ          = 'UTC';
process.env.NODE_ENV    = 'test';

// Server
process.env.HOST        = 'localhost';
process.env.PORT        = '3000';

// JWT
process.env.JWT_SECRET              = 'test_secret_very_long_string_for_jwt_secret_minimum_32_chars';
process.env.JWT_EXPIRES_IN          = '1h';
process.env.JWT_REFRESH_SECRET      = 'test_refresh_secret_very_long_string_for_jwt_refresh_secret_minimum_32_chars';
process.env.JWT_REFRESH_EXPIRES_IN  = '7d';

// Database
process.env.DB_HOST         = 'localhost';
process.env.DB_PORT         = '3306';
process.env.DB_USERNAME     = 'root';
process.env.DB_PASSWORD     = 'password';
process.env.DB_DATABASE     = 'test_db';
process.env.DB_SSL_CA_PATH  = '/path/to/ca.pem';

// SMTP
process.env.SMTP_HOST       = 'smtp.test.com';
process.env.SMTP_PORT       = '587';
process.env.SMTP_USER       = 'test@test.com';
process.env.SMTP_PASSWORD   = 'password';
process.env.SMTP_FROM_EMAIL = 'noreply@test.com';
process.env.SMTP_FROM_NAME  = 'Test';

// ─── 2. MODULE MOCKS ─────────────────────────────────────────────────────────

// sequelize (core): một số model import trực tiếp từ 'sequelize' thay vì 'sequelize-typescript'
jest.mock('sequelize', () => {
  const DataType = {
    INTEGER: Object.assign(() => 'INTEGER', { UNSIGNED: 'INTEGER UNSIGNED', ZEROFILL: 'INTEGER ZEROFILL' }),
    BIGINT:  Object.assign(() => 'BIGINT',  { UNSIGNED: 'BIGINT UNSIGNED' }),
    FLOAT:   Object.assign(() => 'FLOAT',   { UNSIGNED: 'FLOAT UNSIGNED' }),
    DOUBLE:  Object.assign(() => 'DOUBLE',  { UNSIGNED: 'DOUBLE UNSIGNED' }),
    DECIMAL: Object.assign(() => 'DECIMAL', { UNSIGNED: 'DECIMAL UNSIGNED' }),
    STRING:  Object.assign(() => 'STRING',  { BINARY: 'STRING BINARY' }),
    TEXT:    () => 'TEXT',
    BOOLEAN: 'BOOLEAN',
    DATE:    Object.assign(() => 'DATE', {}),
    DATEONLY:'DATEONLY',
    TIME:    'TIME',
    UUID:    'UUID',
    UUIDV4:  'UUIDV4',
    JSON:    'JSON',
    JSONB:   'JSONB',
    ENUM:    (...values: string[]) => `ENUM(${values.join(',')})`,
    ARRAY:   (type: any) => `ARRAY(${type})`,
    VIRTUAL: 'VIRTUAL',
    NOW:     'NOW',
  };

  return {
    DataTypes: DataType,
    Op: {
      eq: Symbol('eq'), ne: Symbol('ne'), gt: Symbol('gt'), gte: Symbol('gte'),
      lt: Symbol('lt'), lte: Symbol('lte'), in: Symbol('in'), notIn: Symbol('notIn'),
      like: Symbol('like'), notLike: Symbol('notLike'), between: Symbol('between'),
      notBetween: Symbol('notBetween'), and: Symbol('and'), or: Symbol('or'),
      not: Symbol('not'), is: Symbol('is'), col: Symbol('col'), any: Symbol('any'),
    },
    Sequelize: jest.fn().mockImplementation(() => ({
      transaction:  jest.fn(),
      authenticate: jest.fn(),
      define:       jest.fn(),
      query:        jest.fn(),
      close:        jest.fn(),
    })),
  };
});

// sequelize-typescript: mock toàn bộ để decorator trở thành no-op và
// MockModel cung cấp đầy đủ static methods cho auto-mock của Jest.
jest.mock('sequelize-typescript', () => {
  class MockModel {
    // Static methods — được Jest auto-mock kế thừa khi mock model files
    static findOne        = jest.fn();
    static findAll        = jest.fn();
    static findByPk       = jest.fn();
    static findAndCountAll = jest.fn();
    static create         = jest.fn();
    static update         = jest.fn();
    static destroy        = jest.fn();
    static bulkCreate     = jest.fn();
    static count          = jest.fn();
    static upsert         = jest.fn();
    static findOrCreate   = jest.fn();
    static truncate       = jest.fn();

    // Instance methods
    update  = jest.fn();
    destroy = jest.fn();
    save    = jest.fn();
    reload  = jest.fn();
    toJSON  = jest.fn();
  }

  return {
    Sequelize: jest.fn().mockImplementation(() => ({
      transaction:  jest.fn(),
      authenticate: jest.fn(),
      define:       jest.fn(),
      query:        jest.fn(),
      close:        jest.fn(),
    })),
    Model: MockModel,

    // DataType — các numeric types cần có sub-properties (UNSIGNED, ZEROFILL...)
    DataType: {
      INTEGER: Object.assign(() => 'INTEGER', { UNSIGNED: 'INTEGER UNSIGNED', ZEROFILL: 'INTEGER ZEROFILL' }),
      BIGINT:  Object.assign(() => 'BIGINT',  { UNSIGNED: 'BIGINT UNSIGNED' }),
      FLOAT:   Object.assign(() => 'FLOAT',   { UNSIGNED: 'FLOAT UNSIGNED' }),
      DOUBLE:  Object.assign(() => 'DOUBLE',  { UNSIGNED: 'DOUBLE UNSIGNED' }),
      DECIMAL: Object.assign(() => 'DECIMAL', { UNSIGNED: 'DECIMAL UNSIGNED' }),
      STRING:  Object.assign(() => 'STRING',  { BINARY: 'STRING BINARY' }),
      TEXT:     () => 'TEXT',
      BOOLEAN:  'BOOLEAN',
      DATE:     Object.assign(() => 'DATE', {}),
      DATEONLY: 'DATEONLY',
      TIME:     'TIME',
      UUID:     'UUID',
      UUIDV1:   'UUIDV1',
      UUIDV4:   'UUIDV4',
      JSON:     'JSON',
      JSONB:    'JSONB',
      BLOB:     Object.assign(() => 'BLOB', {}),
      ENUM:     (...values: string[]) => `ENUM(${values.join(',')})`,
      ARRAY:    (type: any) => `ARRAY(${type})`,
      VIRTUAL:  'VIRTUAL',
      NOW:      'NOW',
    },

    // Decorators — tất cả no-op
    Table:          () => () => {},
    Column:         () => () => {},
    HasMany:        () => () => {},
    HasOne:         () => () => {},
    BelongsTo:      () => () => {},
    BelongsToMany:  () => () => {},
    ForeignKey:     () => () => {},
    PrimaryKey:     () => () => {},
    AllowNull:      () => () => {},
    Default:        () => () => {},
    Unique:         () => () => {},
    CreatedAt:      () => () => {},
    UpdatedAt:      () => () => {},
    DeletedAt:      () => () => {},
    Index:          () => () => {},
    Scopes:         () => () => {},
    AutoIncrement:  () => () => {},
    NotNull:        () => () => {},
    Min:            () => () => {},
    Max:            () => () => {},
    Length:         () => () => {},
    Is:             () => () => {},
    IsEmail:        () => () => {},
    IsUrl:          () => () => {},
    IsDate:         () => () => {},
    IsIn:           () => () => {},
    IsUUID:         () => () => {},
    Comment:        () => () => {},
  };
});

// fs: chặn readFileSync để tránh ENOENT khi database.ts đọc SSL cert
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  readFileSync: jest.fn().mockReturnValue('mock-ca-cert'),
}));