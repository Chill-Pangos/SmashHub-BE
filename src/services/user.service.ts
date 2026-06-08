import User from "../models/user.model";
import Role from "../models/role.model";
import EloScore from "../models/eloScore.model";
import TournamentReferee from "../models/tournamentReferee.model";
import { CreateUserDto, UpdateUserDto } from "../dto/user.dto";
import { Op } from "sequelize";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

export class UserService {
  async create(userData: CreateUserDto): Promise<User> {
    return await User.create(userData as any);
  }

  async findAll(offset: number = 0, limit: number = 10): Promise<{ users: User[], pagination: any }> {
    const { count, rows } = await User.findAndCountAll({
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);
    const page = Math.floor(offset / limit) + 1;

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

  async findMe(userId: number): Promise<User | null> {
    return await User.findByPk(userId, {
      attributes: {
        exclude: ["password"],
      },
      include: [
        {
          model: Role,
          as: "roles",
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
        {
          model: EloScore,
          as: "eloScore",
          required: false,
        },
      ],
    });
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

  async findAvailableChiefReferees(offset: number = 0, limit: number = 10): Promise<{ referees: User[]; pagination?: any }> {
    const assignedRefereeIds = await TournamentReferee.findAll({
      attributes: ['refereeId'],
      where: {
        role: 'main'
      },
      raw: true
    });

    const assignedIds = assignedRefereeIds.map(ref => ref.refereeId);

    // If pagination is requested
    if (offset !== undefined || limit !== undefined) {
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
        offset,
        limit: limit,
        order: [['createdAt', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);
      const page = Math.floor(offset / limit) + 1;

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

  async uploadAvatar(userId: number, file: Express.Multer.File): Promise<User | null> {
  const user = await User.findByPk(userId);
  if (!user) {
    await fs.unlink(file.path); // cleanup orphan
    return null;
  }

  // Xóa avatar cũ
  if (user.avatarUrl) {
    const oldPath = path.join("uploads/avatars", path.basename(user.avatarUrl));
    await fs.unlink(oldPath).catch(() => {}); // ignore if not found
  }

  // Resize → webp
  const outputFilename = `${path.basename(file.filename, path.extname(file.filename))}.webp`;
  const outputPath = path.join("uploads/avatars", outputFilename);

  await sharp(file.path)
    .resize(256, 256, { fit: "cover" })
    .webp({ quality: 80 })
    .toFile(outputPath);

  await fs.unlink(file.path); // xóa file gốc

  const avatarUrl = `/uploads/avatars/${outputFilename}`;
  return await user.update({ avatarUrl });
}
}

export default new UserService();
