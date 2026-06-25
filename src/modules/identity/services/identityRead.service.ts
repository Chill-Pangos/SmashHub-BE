import User from "../models/user.model";
import Role from "../models/role.model";
import authService from "./auth.service";
import type { PublicUserSummary } from "../public.contracts";

export class IdentityReadService {
  verifyToken(token: string): Promise<{ userId: number }> {
    return authService.verifyToken(token);
  }

  async getAdminUserIds(): Promise<number[]> {
    const admins = await User.findAll({
      attributes: ["id"],
      include: [
        {
          model: Role,
          as: "roles",
          where: { name: "admin" },
          through: { attributes: [] },
          required: true,
        },
      ],
    });

    return admins.map((admin) => admin.id);
  }

  async getPublicUsersByIds(userIds: number[]): Promise<PublicUserSummary[]> {
    if (userIds.length === 0) return [];

    const users = await User.findAll({
      where: { id: userIds },
      attributes: ["id", "firstName", "lastName", "avatarUrl"],
    });

    return users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    }));
  }
}

export default new IdentityReadService();
