export const mockUserModel = {
  create: jest.fn(),
  findOne: jest.fn(),
  findByPk: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

export const mockTokenModel = {
  create: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

export const mockOtpModel = {
  create: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};

export const mockRoleModel = {
  findOne: jest.fn(),
  findByPk: jest.fn(),
};

export const mockUserRoleModel = {
  create: jest.fn(),
  findAll: jest.fn(),
};

export const resetAllMocks = () => {
  jest.clearAllMocks();
};

