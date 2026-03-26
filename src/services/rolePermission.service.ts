import RolePermission from "../models/rolePermission.model";
import { CreateRolePermissionDto, UpdateRolePermissionDto } from "../dto/rolePermission.dto";

export class RolePermissionService {
  async create(data: CreateRolePermissionDto): Promise<RolePermission> {
    return await RolePermission.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<RolePermission[]> {
    return await RolePermission.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<RolePermission | null> {
    return await RolePermission.findByPk(id);
  }

  async findByRoleId(
    roleId: number,
    skip = 0,
    limit = 10
  ): Promise<RolePermission[]> {
    return await RolePermission.findAll({
      where: { roleId },
      offset: skip,
      limit,
    });
  }

  async findByPermissionId(
    permissionId: number,
    skip = 0,
    limit = 10
  ): Promise<RolePermission[]> {
    return await RolePermission.findAll({
      where: { permissionId },
      offset: skip,
      limit,
    });
  }

  async findByRoleIdAndPermissionId(
    roleId: number,
    permissionId: number
  ): Promise<RolePermission | null> {
    return await RolePermission.findOne({
      where: { roleId, permissionId },
    });
  }

  async update(id: number, data: UpdateRolePermissionDto): Promise<[number, RolePermission[]]> {
    return await RolePermission.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await RolePermission.destroy({ where: { id } });
  }

  async deleteByRoleIdAndPermissionId(roleId: number, permissionId: number): Promise<number> {
    return await RolePermission.destroy({ where: { roleId, permissionId } });
  }
}

export default new RolePermissionService();
