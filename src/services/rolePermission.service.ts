// services/rolePermission.service.ts

import { Op } from "sequelize";
import RolePermission from "../models/rolePermission.model";
import Role from "../models/role.model";
import Permission from "../models/permission.model";
import { CreateRolePermissionDto } from "../dto/rolePermission.dto";
import { NotFoundError, ConflictError } from "../utils/errors";

const ROLE_ATTRIBUTES = ["id", "name"];
const PERMISSION_ATTRIBUTES = ["id", "name"];

export class RolePermissionService {
  // ─── Private Helpers ────────────────────────────────────────────────────────

  private async assertRoleAndPermissionExist(
    roleId: number,
    permissionId: number
  ): Promise<void> {
    const [role, permission] = await Promise.all([
      Role.findByPk(roleId, { attributes: ["id"] }),
      Permission.findByPk(permissionId, { attributes: ["id"] }),
    ]);

    if (!role) throw new NotFoundError("Role not found", "ROLE_NOT_FOUND");
    if (!permission) throw new NotFoundError("Permission not found", "PERMISSION_NOT_FOUND");
  }

  private async findAssignmentOrFail(
    roleId: number,
    permissionId: number
  ): Promise<RolePermission> {
    const assignment = await RolePermission.findOne({ where: { roleId, permissionId } });
    if (!assignment) {
      throw new NotFoundError(
        "Role-permission assignment not found",
        "ROLE_PERMISSION_NOT_FOUND"
      );
    }
    return assignment;
  }

  // ─── Public Methods ──────────────────────────────────────────────────────────

  async create(data: CreateRolePermissionDto): Promise<RolePermission> {
    const { roleId, permissionId } = data;

    await this.assertRoleAndPermissionExist(roleId, permissionId);

    const existing = await RolePermission.findOne({ where: { roleId, permissionId } });
    if (existing) {
      throw new ConflictError(
        "Permission already assigned to role",
        "ROLE_PERMISSION_ALREADY_EXISTS"
      );
    }

    return RolePermission.create(data as any);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const { rows, count } = await RolePermission.findAndCountAll({
      offset: (page - 1) * limit,
      limit,
      include: [
        { model: Role, attributes: ROLE_ATTRIBUTES },
        { model: Permission, attributes: PERMISSION_ATTRIBUTES },
      ],
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);
    return {
      rolePermissions: rows,
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

  async findByRoleId(roleId: number, page: number = 1, limit: number = 10) {
    const [role, result] = await Promise.all([
      Role.findByPk(roleId, { attributes: ["id"] }),
      RolePermission.findAndCountAll({
        where: { roleId },
        offset: (page - 1) * limit,
        limit,
        include: [{ model: Permission, attributes: PERMISSION_ATTRIBUTES }],
      }),
    ]);

    if (!role) throw new NotFoundError("Role not found", "ROLE_NOT_FOUND");

    const totalPages = Math.ceil(result.count / limit);
    return {
      rolePermissions: result.rows,
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

  async findByPermissionId(permissionId: number, page: number = 1, limit: number = 10) {
    const [permission, result] = await Promise.all([
      Permission.findByPk(permissionId, { attributes: ["id"] }),
      RolePermission.findAndCountAll({
        where: { permissionId },
        offset: (page - 1) * limit,
        limit,
        include: [{ model: Role, attributes: ROLE_ATTRIBUTES }],
      }),
    ]);

    if (!permission) throw new NotFoundError("Permission not found", "PERMISSION_NOT_FOUND");

    const totalPages = Math.ceil(result.count / limit);
    return {
      rolePermissions: result.rows,
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

  async hasPermission(roleId: number, permissionId: number): Promise<boolean> {
    const count = await RolePermission.count({ where: { roleId, permissionId } });
    return count > 0;
  }

  async bulkCreate(roleId: number, permissionIds: number[]): Promise<RolePermission[]> {
    if (!permissionIds.length) return [];

    const role = await Role.findByPk(roleId, { attributes: ["id"] });
    if (!role) throw new NotFoundError("Role not found", "ROLE_NOT_FOUND");

    const permissions = await Permission.findAll({
      where: { id: permissionIds },
      attributes: ["id"],
    });
    if (permissions.length !== permissionIds.length) {
      throw new NotFoundError("One or more permissions not found", "PERMISSION_NOT_FOUND");
    }

    const existingAssignments = await RolePermission.findAll({
      where: { roleId, permissionId: { [Op.in]: permissionIds } },
      attributes: ["permissionId"],
    });
    const existingPermissionIds = new Set(existingAssignments.map(a => a.permissionId));
    const newPermissionIds = permissionIds.filter(id => !existingPermissionIds.has(id));

    if (!newPermissionIds.length) return [];

    return RolePermission.bulkCreate(
      newPermissionIds.map(permissionId => ({ roleId, permissionId })) as any[]
    );
  }

  async deleteByRoleIdAndPermissionId(roleId: number, permissionId: number): Promise<void> {
    const assignment = await this.findAssignmentOrFail(roleId, permissionId);
    await assignment.destroy();
  }
}

export default new RolePermissionService();