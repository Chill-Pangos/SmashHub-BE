import User from "../models/user.model";
import Role from "../models/role.model";
import TournamentReferee from "../models/tournamentReferee.model";
import { CreateUserDto, UpdateUserDto } from "../dto/user.dto";
import { Op } from "sequelize";

export class UserService {
  async create(userData: CreateUserDto): Promise<User> {
    return await User.create(userData as any);
  }

  async findAll(skip: number = 0, limit: number = 10): Promise<{ users: User[], pagination: any }> {
    const offset = skip;
    const { count, rows } = await User.findAndCountAll({
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);
    const page = Math.floor(skip / limit) + 1;

    return {
      users: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
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

  async findAvailableChiefReferees(skip: number = 0, limit: number = 10): Promise<{ referees: User[]; pagination?: any }> {
    const assignedRefereeIds = await TournamentReferee.findAll({
      attributes: ['refereeId'],
      where: {
        role: 'main'
      },
      raw: true
    });

    const assignedIds = assignedRefereeIds.map(ref => ref.refereeId);

    // If pagination is requested
    if (skip !== undefined || limit !== undefined) {
      const { count, rows } = await User.findAndCountAll({
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
        } : {},
        offset: skip,
        limit: limit,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);
      const page = Math.floor(skip / limit) + 1;

      return {
        referees: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    }

    const rows = await User.findAll({
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

    return { referees: rows };
  }
}

export default new UserService();
