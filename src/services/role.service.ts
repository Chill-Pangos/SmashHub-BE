// services/role.service.ts

import Role from "../models/role.model";
import { CreateRoleDto, UpdateRoleDto } from "../dto/role.dto";
import { BadRequestError, NotFoundError, ConflictError } from "../utils/errors";

export class RoleService {
  // ─── Private Helpers ────────────────────────────────────────────────────────

  private async assertNameNotTaken(name: string, excludeId?: number): Promise<void> {
    const existing = await Role.findOne({ where: { name } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictError("Role name already exists", "ROLE_ALREADY_EXISTS");
    }
  }

  private async findOrFail(id: number): Promise<Role> {
    const role = await Role.findByPk(id);
    if (!role) throw new NotFoundError("Role not found", "ROLE_NOT_FOUND");
    return role;
  }

  // ─── Public Methods ──────────────────────────────────────────────────────────

  async create(data: CreateRoleDto): Promise<Role> {
    if (!data.name?.trim()) {
      throw new BadRequestError("Role name is required", "ROLE_NAME_REQUIRED");
    }

    await this.assertNameNotTaken(data.name);

    return Role.create(data as any);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const { rows, count } = await Role.findAndCountAll({
      offset: (page - 1) * limit,
      limit,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);
    return {
      roles: rows,
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

  async findById(id: number): Promise<Role> {
    return this.findOrFail(id);
  }

  async findByName(name: string): Promise<Role> {
    const role = await Role.findOne({ where: { name } });
    if (!role) throw new NotFoundError("Role not found", "ROLE_NOT_FOUND");
    return role;
  }

  async update(id: number, data: UpdateRoleDto): Promise<Role> {
    const role = await this.findOrFail(id);

    if (data.name && data.name !== role.name) {
      await this.assertNameNotTaken(data.name, id);
    }

    await role.update(data);
    return role;
  }

  async delete(id: number): Promise<void> {
    const role = await this.findOrFail(id);
    await role.destroy();
  }
}

export default new RoleService();