// services/permission.service.ts

import Permission from "../models/permission.model";
import { CreatePermissionDto, UpdatePermissionDto } from "../dto/permission.dto";
import { BadRequestError, NotFoundError, ConflictError } from "../utils/errors";

const PERMISSION_NAME_REGEX = /^[a-z0-9_]+:[a-z0-9_]+$/;

export class PermissionService {
  // ─── Private Helpers ────────────────────────────────────────────────────────

  private validateNameFormat(name: string): void {
    if (!PERMISSION_NAME_REGEX.test(name)) {
      throw new BadRequestError(
        "Permission name must follow format 'resource:action' (e.g. 'match:read')",
        "PERMISSION_FORMAT_INVALID"
      );
    }
  }

  private async assertNameNotTaken(name: string, excludeId?: number): Promise<void> {
    const existing = await Permission.findOne({ where: { name } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictError("Permission already exists", "PERMISSION_ALREADY_EXISTS");
    }
  }

  private async findOrFail(id: number): Promise<Permission> {
    const permission = await Permission.findByPk(id);
    if (!permission) throw new NotFoundError("Permission not found", "PERMISSION_NOT_FOUND");
    return permission;
  }

  // ─── Public Methods ──────────────────────────────────────────────────────────

  async create(data: CreatePermissionDto): Promise<Permission> {
    if (!data.name?.trim()) {
      throw new BadRequestError("Permission name is required", "PERMISSION_NAME_REQUIRED");
    }

    this.validateNameFormat(data.name);
    await this.assertNameNotTaken(data.name);

    return Permission.create(data as any);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const { rows, count } = await Permission.findAndCountAll({
      offset: (page - 1) * limit,
      limit,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);
    return {
      permissions: rows,
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

  async findById(id: number): Promise<Permission> {
    return this.findOrFail(id);
  }

  async findByName(name: string): Promise<Permission> {
    const permission = await Permission.findOne({ where: { name } });
    if (!permission) throw new NotFoundError("Permission not found", "PERMISSION_NOT_FOUND");
    return permission;
  }

  async update(id: number, data: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOrFail(id);

    if (data.name && data.name !== permission.name) {
      this.validateNameFormat(data.name);
      await this.assertNameNotTaken(data.name, id);
    }

    await permission.update(data);
    return permission;
  }

  async delete(id: number): Promise<void> {
    const permission = await this.findOrFail(id);
    await permission.destroy();
  }
}

export default new PermissionService();