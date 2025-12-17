import User from "../models/user.model";
import { CreateUserDto, UpdateUserDto } from "../dto/user.dto";

export class UserService {
  async create(userData: CreateUserDto): Promise<User> {
    return await User.create(userData as any);
  }

  async findAll(): Promise<User[]> {
    return await User.findAll();
  }

  async findById(id: number): Promise<User | null> {
    return await User.findByPk(id);
  }

  async update(
    id: number,
    userData: Partial<UpdateUserDto>
  ): Promise<User | null> {
    const user = await User.findByPk(id);
    if (!user) return null;
    return await user.update(userData);
  }

  async delete(id: number): Promise<boolean> {
    const deletedCount = await User.destroy({ where: { id } });
    return deletedCount > 0;
  }
}

export default new UserService();
