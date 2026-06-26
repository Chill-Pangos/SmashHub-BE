import { Op } from "sequelize";
import Otp from "../models/otp.model";
import Token from "../models/token.model";

class IdentityCleanupService {
  async cleanupExpiredOtps(now = new Date()): Promise<number> {
    return Otp.destroy({
      where: {
        [Op.or]: [
          { expiresAt: { [Op.lt]: now } },
          { isUsed: true },
        ],
      },
    });
  }

  async cleanupExpiredAccessTokens(now = new Date()): Promise<number> {
    return Token.destroy({
      where: {
        type: "access",
        [Op.or]: [
          { expiresAt: { [Op.lt]: now } },
          { isBlacklisted: true },
        ],
      },
    });
  }

  async cleanupExpiredRefreshTokens(now = new Date()): Promise<number> {
    return Token.destroy({
      where: {
        type: "refresh",
        [Op.or]: [
          { expiresAt: { [Op.lt]: now } },
          { isBlacklisted: true },
        ],
      },
    });
  }
}

export default new IdentityCleanupService();
