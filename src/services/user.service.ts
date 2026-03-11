import User from "../models/user.model";
import Role from "../models/role.model";
import TournamentReferee from "../models/tournamentReferee.model";
import { CreateUserDto, UpdateUserDto } from "../dto/user.dto";
import { Op } from "sequelize";

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

  async updateProfile(
    id: number,
    profileData: {
      avatarUrl?: string;
      dob?: Date;
      phoneNumber?: string;
      gender?: string;
    }
  ): Promise<User | null> {
    const user = await User.findByPk(id);
    if (!user) return null;
    return await user.update(profileData);
  }

  async delete(id: number): Promise<boolean> {
    const deletedCount = await User.destroy({ where: { id } });
    return deletedCount > 0;
  }

  async findAvailableChiefReferees(): Promise<User[]> {
    const assignedRefereeIds = await TournamentReferee.findAll({
      attributes: ['refereeId'],
      where: {
        role: 'main'
      },
      raw: true
    });

    const assignedIds = assignedRefereeIds.map(ref => ref.refereeId);

    return await User.findAll({
      include: [
        {
          model: Role,
          as: 'roles',
          where: {
            name: 'chief_referee'
          },
          through: { attributes: [] }
        }
      ],
      where: assignedIds.length > 0 ? {
        id: {
          [Op.notIn]: assignedIds
        }
      } : {}
    });
  }
}

export default new UserService();
