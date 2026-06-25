import User from "../models/user.model";
import Role from "../models/role.model";
import authService from "./auth.service";
import { Op } from "sequelize";
import type {
  PublicUserSummary,
  RegistrationUserSummary,
} from "../public.contracts";

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

  async isAdmin(userId: number): Promise<boolean> {
    const count = await User.count({
      where: { id: userId },
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
    return count > 0;
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

  async getRegistrationUser(userId: number): Promise<RegistrationUserSummary | null> {
    const user = await User.findByPk(userId, {
      attributes: ["id", "firstName", "lastName", "email", "gender", "dob", "avatarUrl"],
    });
    return user ? this.toRegistrationUser(user) : null;
  }

  async getRegistrationUsersByIds(userIds: number[]): Promise<RegistrationUserSummary[]> {
    const uniqueUserIds = Array.from(new Set(userIds));
    if (uniqueUserIds.length === 0) return [];

    const users = await User.findAll({
      where: { id: { [Op.in]: uniqueUserIds } },
      attributes: ["id", "firstName", "lastName", "email", "gender", "dob", "avatarUrl"],
    });

    return users.map((user) => this.toRegistrationUser(user));
  }

  async searchUserIdsByName(name: string): Promise<number[]> {
    const query = name.trim();
    if (!query) return [];

    const users = await User.findAll({
      where: {
        [Op.or]: [
          { firstName: { [Op.like]: `%${query}%` } },
          { lastName: { [Op.like]: `%${query}%` } },
        ],
      },
      attributes: ["id"],
    });

    return users.map((user) => user.id);
  }

  private toRegistrationUser(user: User): RegistrationUserSummary {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      ...(user.gender ? { gender: user.gender } : {}),
      ...(user.dob ? { dob: user.dob } : {}),
      ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    };
  }
}

export default new IdentityReadService();
