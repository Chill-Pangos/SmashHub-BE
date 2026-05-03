// services/userRole.service.ts

import { Op } from "sequelize";
import UserRole from "../models/userRole.model";
import User from "../models/user.model";
import Role from "../models/role.model";
import { CreateUserRoleDto } from "../dto/userRole.dto";
import { NotFoundError, ConflictError } from "../utils/errors";

const USER_ATTRIBUTES = ["id", "email", "firstName", "lastName"];
const ROLE_ATTRIBUTES = ["id", "name"];

export class UserRoleService {
  // ─── Private Helpers ────────────────────────────────────────────────────────

  private async assertUserAndRoleExist(userId: number, roleId: number): Promise<void> {
    const [user, role] = await Promise.all([
      User.findByPk(userId, { attributes: ["id"] }),
      Role.findByPk(roleId, { attributes: ["id"] }),
    ]);

    if (!user) throw new NotFoundError("User not found", "USER_NOT_FOUND");
    if (!role) throw new NotFoundError("Role not found", "ROLE_NOT_FOUND");
  }

  private async findAssignmentOrFail(userId: number, roleId: number): Promise<UserRole> {
    const assignment = await UserRole.findOne({ where: { userId, roleId } });
    if (!assignment) {
      throw new NotFoundError("User-role assignment not found", "USER_ROLE_NOT_FOUND");
    }
    return assignment;
  }

  // ─── Public Methods ──────────────────────────────────────────────────────────

  async create(data: CreateUserRoleDto): Promise<UserRole> {
    const { userId, roleId } = data;

    await this.assertUserAndRoleExist(userId, roleId);

    const existing = await UserRole.findOne({ where: { userId, roleId } });
    if (existing) {
      throw new ConflictError("Role already assigned to user", "USER_ROLE_ALREADY_EXISTS");
    }

    return UserRole.create(data as any);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const { rows, count } = await UserRole.findAndCountAll({
      offset: (page - 1) * limit,
      limit,
      include: [
        { model: User, attributes: USER_ATTRIBUTES },
        { model: Role, attributes: ROLE_ATTRIBUTES },
      ],
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);
    return {
      userRoles: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findByUserId(userId: number, page: number = 1, limit: number = 10) {
    const [user, result] = await Promise.all([
      User.findByPk(userId, { attributes: ["id"] }),
      UserRole.findAndCountAll({
        where: { userId },
        offset: (page - 1) * limit,
        limit,
        include: [{ model: Role, attributes: ROLE_ATTRIBUTES }],
      }),
    ]);

    if (!user) throw new NotFoundError("User not found", "USER_NOT_FOUND");

    const totalPages = Math.ceil(result.count / limit);
    return {
      userRoles: result.rows,
      pagination: {
        total: result.count,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async findByRoleId(roleId: number, page: number = 1, limit: number = 10) {
    const [role, result] = await Promise.all([
      Role.findByPk(roleId, { attributes: ["id"] }),
      UserRole.findAndCountAll({
        where: { roleId },
        offset: (page - 1) * limit,
        limit,
        include: [{ model: User, attributes: USER_ATTRIBUTES }],
      }),
    ]);

    if (!role) throw new NotFoundError("Role not found", "ROLE_NOT_FOUND");

    const totalPages = Math.ceil(result.count / limit);
    return {
      userRoles: result.rows,
      pagination: {
        total: result.count,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async hasRole(userId: number, roleId: number): Promise<boolean> {
    const count = await UserRole.count({ where: { userId, roleId } });
    return count > 0;
  }

  async bulkCreate(userId: number, roleIds: number[]): Promise<UserRole[]> {
    if (!roleIds.length) return [];

    const user = await User.findByPk(userId, { attributes: ["id"] });
    if (!user) throw new NotFoundError("User not found", "USER_NOT_FOUND");

    const roles = await Role.findAll({ where: { id: roleIds }, attributes: ["id"] });
    if (roles.length !== roleIds.length) {
      throw new NotFoundError("One or more roles not found", "ROLE_NOT_FOUND");
    }

    const existingAssignments = await UserRole.findAll({
      where: { userId, roleId: { [Op.in]: roleIds } },
      attributes: ["roleId"],
    });
    const existingRoleIds = new Set(existingAssignments.map(a => a.roleId));
    const newRoleIds = roleIds.filter(id => !existingRoleIds.has(id));

    if (!newRoleIds.length) return [];

    return UserRole.bulkCreate(newRoleIds.map(roleId => ({ userId, roleId })) as any[]);
  }

  async deleteByUserIdAndRoleId(userId: number, roleId: number): Promise<void> {
    const assignment = await this.findAssignmentOrFail(userId, roleId);
    await assignment.destroy();
  }
}

export default new UserRoleService();