import Role from "../models/role.model";
import { CreateRoleDto, UpdateRoleDto } from "../dto/role.dto";

export class RoleService {
  async create(data: CreateRoleDto): Promise<Role> {
    return await Role.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<Role[]> {
    return await Role.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<Role | null> {
    return await Role.findByPk(id);
  }

  async findByName(name: string): Promise<Role | null> {
    return await Role.findOne({ where: { name } });
  }

  async update(id: number, data: UpdateRoleDto): Promise<[number, Role[]]> {
    return await Role.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await Role.destroy({ where: { id } });
  }
}

export default new RoleService();
