import UserRole from "../models/userRole.model";
import { CreateUserRoleDto, UpdateUserRoleDto } from "../dto/userRole.dto";

export class UserRoleService {
  async create(data: CreateUserRoleDto): Promise<UserRole> {
    return await UserRole.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<UserRole[]> {
    return await UserRole.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<UserRole | null> {
    return await UserRole.findByPk(id);
  }

  async findByUserId(
    userId: number,
    skip = 0,
    limit = 10
  ): Promise<UserRole[]> {
    return await UserRole.findAll({
      where: { userId },
      offset: skip,
      limit,
    });
  }

  async findByRoleId(
    roleId: number,
    skip = 0,
    limit = 10
  ): Promise<UserRole[]> {
    return await UserRole.findAll({
      where: { roleId },
      offset: skip,
      limit,
    });
  }

  async findByUserIdAndRoleId(
    userId: number,
    roleId: number
  ): Promise<UserRole | null> {
    return await UserRole.findOne({
      where: { userId, roleId },
    });
  }

  async update(id: number, data: UpdateUserRoleDto): Promise<[number, UserRole[]]> {
    return await UserRole.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await UserRole.destroy({ where: { id } });
  }

  async deleteByUserIdAndRoleId(userId: number, roleId: number): Promise<number> {
    return await UserRole.destroy({ where: { userId, roleId } });
  }
}

export default new UserRoleService();
