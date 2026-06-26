import User from "../models/user.model";
import Role from "../models/role.model";
import UserRole from "../models/userRole.model";
import Permission from "../models/permission.model";
import authService from "./auth.service";
import { Op } from "sequelize";
import type {
  AuthenticatedUserSummary,
  PublicUserSummary,
  RegistrationUserSummary,
  TournamentUserSearchInput,
  TournamentUserSearchResult,
  TournamentUserSummary,
  UserAccessSummary,
} from "../public.contracts";

export class IdentityReadService {
  verifyToken(token: string): Promise<{ userId: number }> {
    return authService.verifyToken(token);
  }

  isTokenBlacklisted(token: string): Promise<boolean> {
    return authService.isTokenBlacklisted(token);
  }

  async getAuthenticatedUserByToken(token: string): Promise<AuthenticatedUserSummary | null> {
    const user = await authService.getUserByToken(token);
    if (!user) return null;

    return {
      ...this.toTournamentUser(user),
      isEmailVerified: user.isEmailVerified,
    };
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

  async getTournamentUser(userId: number): Promise<TournamentUserSummary | null> {
    const user = await User.findByPk(userId, {
      attributes: ["id", "firstName", "lastName", "email", "gender", "avatarUrl"],
    });
    return user ? this.toTournamentUser(user) : null;
  }

  async getTournamentUsersByIds(userIds: number[]): Promise<TournamentUserSummary[]> {
    const uniqueUserIds = Array.from(new Set(userIds));
    if (uniqueUserIds.length === 0) return [];

    const users = await User.findAll({
      where: { id: { [Op.in]: uniqueUserIds } },
      attributes: ["id", "firstName", "lastName", "email", "gender", "avatarUrl"],
    });

    return users.map((user) => this.toTournamentUser(user));
  }

  async userHasRole(userId: number, roleName: string): Promise<boolean> {
    return this.userHasAnyRole(userId, [roleName]);
  }

  async userHasAnyRole(userId: number, roleNames: string[]): Promise<boolean> {
    const uniqueRoleNames = Array.from(new Set(roleNames));
    if (uniqueRoleNames.length === 0) return false;

    const userRole = await UserRole.findOne({
      where: { userId },
      include: [
        {
          model: Role,
          as: "role",
          where: { name: { [Op.in]: uniqueRoleNames } },
          required: true,
          attributes: [],
        },
      ],
    });

    return Boolean(userRole);
  }

  async getUserIdsByRoles(roleNames: string[]): Promise<number[]> {
    const uniqueRoleNames = Array.from(new Set(roleNames));
    if (uniqueRoleNames.length === 0) return [];

    const roleRows = await UserRole.findAll({
      attributes: ["userId"],
      include: [
        {
          model: Role,
          as: "role",
          where: { name: { [Op.in]: uniqueRoleNames } },
          required: true,
          attributes: [],
        },
      ],
    });

    return Array.from(new Set(roleRows.map((row) => row.userId)));
  }

  async getUserAccess(userId: number): Promise<UserAccessSummary> {
    const user = await User.findByPk(userId, {
      attributes: ["id"],
      include: [
        {
          model: Role,
          as: "roles",
          attributes: ["name"],
          through: { attributes: [] },
          include: [
            {
              model: Permission,
              as: "permissions",
              attributes: ["name"],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });
    if (!user) return { exists: false, roles: [], permissions: [] };

    const plain = user.get({ plain: true }) as {
      roles?: Array<{ name?: string; permissions?: Array<{ name?: string }> }>;
    };
    const roles = new Set<string>();
    const permissions = new Set<string>();

    for (const role of plain.roles ?? []) {
      if (role.name) roles.add(role.name);
      for (const permission of role.permissions ?? []) {
        if (permission.name) permissions.add(permission.name);
      }
    }

    return {
      exists: true,
      roles: [...roles],
      permissions: [...permissions],
    };
  }

  async userHasPermission(userId: number, permissionName: string): Promise<boolean> {
    const access = await this.getUserAccess(userId);
    return access.permissions.includes(permissionName);
  }

  async userHasAnyPermission(userId: number, permissionNames: string[]): Promise<boolean> {
    const required = Array.from(new Set(permissionNames));
    if (required.length === 0) return false;
    const access = await this.getUserAccess(userId);
    return required.some((permission) => access.permissions.includes(permission));
  }

  async userHasAllPermissions(userId: number, permissionNames: string[]): Promise<boolean> {
    const required = Array.from(new Set(permissionNames));
    if (required.length === 0) return true;
    const access = await this.getUserAccess(userId);
    return required.every((permission) => access.permissions.includes(permission));
  }

  async findTournamentUsersByIds(
    input: TournamentUserSearchInput,
  ): Promise<TournamentUserSearchResult> {
    const includeIds = Array.from(new Set(input.includeIds));
    if (includeIds.length === 0) {
      return { users: [], total: 0 };
    }

    const excludeIds = Array.from(new Set(input.excludeIds ?? []));
    const idFilter: Record<symbol, number[]> = {
      [Op.in]: includeIds,
    };
    if (excludeIds.length > 0) {
      idFilter[Op.notIn] = excludeIds;
    }

    const where: any = { id: idFilter };
    const search = input.search?.trim();
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: ["id", "firstName", "lastName", "email", "gender", "avatarUrl"],
      order: [
        ["firstName", "ASC"],
        ["lastName", "ASC"],
      ],
      offset: input.offset ?? 0,
      ...(input.limit != null && input.limit > 0 ? { limit: input.limit } : {}),
      distinct: true,
    });

    return {
      users: rows.map((user) => this.toTournamentUser(user)),
      total: count,
    };
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

  private toTournamentUser(user: User): TournamentUserSummary {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      ...(user.gender ? { gender: user.gender } : {}),
      ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    };
  }
}

export default new IdentityReadService();
