export default {
  sendPasswordResetOTP: jest.fn().mockResolvedValue(undefined),
  sendEmailVerificationOTP: jest.fn().mockResolvedValue(undefined),
  sendPasswordChangedNotification: jest.fn().mockResolvedValue(undefined),
};
