import Permission from "../models/permission.model";
import {
  CreatePermissionDto,
  UpdatePermissionDto,
} from "../dto/permission.dto";

export class PermissionService {
  async create(data: CreatePermissionDto): Promise<Permission> {
    return await Permission.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<Permission[]> {
    return await Permission.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<Permission | null> {
    return await Permission.findByPk(id);
  }

  async findByName(name: string): Promise<Permission | null> {
    return await Permission.findOne({ where: { name } });
  }

  async update(
    id: number,
    data: UpdatePermissionDto
  ): Promise<[number, Permission[]]> {
    return await Permission.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await Permission.destroy({ where: { id } });
  }
}

export default new PermissionService();
