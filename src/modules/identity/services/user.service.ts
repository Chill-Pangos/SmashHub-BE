import User from "../models/user.model";
import Role from "../models/role.model";
import UserRole from "../models/userRole.model";
import { CreateUserDto, UpdateUserDto } from "../dto/user.dto";
import { col, fn, Op, where } from "sequelize";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import config from "../../../config/config";
import { removeUndefinedFields } from "../../../utils/object.helper";
import { sequelize } from "../../../config/database";
import { validateEmail, validatePassword } from "../../../utils/validation.helper";
import { BadRequestError, ConflictError, NotFoundError } from "../../../utils/errors.helper";
import { PUBLIC_USER_ATTRIBUTES } from "../../../utils/userProjection.helper";
import { rankingReadService } from "../../ranking/public.read";
import { rankingWriteService } from "../../ranking/public.write";
import { tournamentReadService } from "../../tournament/public.read";

function setAssociation(
  instance: { setDataValue?: (key: string, value: unknown) => void },
  key: string,
  value: unknown,
): void {
  if (instance.setDataValue) {
    instance.setDataValue(key, value);
    return;
  }
  (instance as Record<string, unknown>)[key] = value;
}

async function attachEloScores(users: User[]): Promise<void> {
  const userIds = users.map((user) => user.id);
  if (userIds.length === 0) return;

  const eloScores = await rankingReadService.getUserEloViews(userIds);
  const eloByUserId = new Map(eloScores.map((eloScore) => [eloScore.userId, eloScore]));

  for (const user of users) {
    setAssociation(user, "eloScore", eloByUserId.get(user.id) ?? null);
  }
}

export class UserService {
  async create(userData: CreateUserDto): Promise<User> {
    const rawData = userData as CreateUserDto & { role?: unknown; roleIds?: unknown };
    if (
      Object.prototype.hasOwnProperty.call(rawData, "role") ||
      Object.prototype.hasOwnProperty.call(rawData, "roleIds")
    ) {
      throw new BadRequestError("role cannot be set during user creation");
    }

    try {
      validateEmail(userData.email);
      validatePassword(userData.password);
    } catch (error) {
      throw new BadRequestError(error instanceof Error ? error.message : "Invalid user data");
    }

    const existingUser = await User.findOne({ where: { email: userData.email } });
    if (existingUser) throw new ConflictError("Email already exists");

    const userRole = await Role.findOne({ where: { name: "user" } });
    if (!userRole) throw new NotFoundError("Role not found");

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const userId = await sequelize.transaction(async (transaction) => {
      const user = await User.create(
        {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: hashedPassword,
          avatarUrl: userData.avatarUrl,
          dob: userData.dob,
          phoneNumber: userData.phoneNumber,
          gender: userData.gender,
          isEmailVerified: false,
        } as any,
        { transaction },
      );

      await UserRole.create(
        {
          userId: user.id,
          roleId: userRole.id,
        } as any,
        { transaction },
      );

      await rankingWriteService.createInitialUserElo(user.id, { transaction });

      return user.id;
    });

    const createdUser = await this.findMe(userId);
    if (!createdUser) throw new NotFoundError("User not found");
    return createdUser;
  }

  async findAll(
    offset: number = 0,
    limit: number = 10,
  ): Promise<{ users: User[]; pagination: any }> {
    const { count, rows } = await User.findAndCountAll({
      attributes: [...PUBLIC_USER_ATTRIBUTES],
      include: [
        {
          model: Role,
          as: "roles",
          attributes: ["id", "name"],
          through: { attributes: [] },
          required: false,
        },
      ],
      offset,
      limit,
      order: [["createdAt", "DESC"]],
      distinct: true,
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
        hasPrevPage: page > 1,
      },
    };
  }

  async searchByName(
    name: string,
    offset: number = 0,
    limit: number = 10,
  ): Promise<{ users: User[]; pagination: any }> {
    const query = name.trim();
    const pattern = `%${query}%`;

    const { count, rows } = await User.findAndCountAll({
      where: {
        [Op.or]: [
          { firstName: { [Op.like]: pattern } },
          { lastName: { [Op.like]: pattern } },
          where(fn("CONCAT", col("firstName"), " ", col("lastName")), {
            [Op.like]: pattern,
          }),
        ],
      },
      attributes: [...PUBLIC_USER_ATTRIBUTES],
      offset,
      limit,
      order: [
        ["firstName", "ASC"],
        ["lastName", "ASC"],
      ],
      distinct: true,
    });
    await attachEloScores(rows);

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
        hasPrevPage: page > 1,
      },
    };
  }

  async findById(id: number): Promise<User | null> {
    const user = await User.findByPk(id, {
      attributes: [...PUBLIC_USER_ATTRIBUTES],
    });
    if (user) await attachEloScores([user]);
    return user;
  }

  async findMe(userId: number): Promise<User | null> {
    const user = await User.findByPk(userId, {
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
      ],
    });
    if (user) await attachEloScores([user]);
    return user;
  }

  async update(
    id: number,
    userData: Partial<UpdateUserDto>,
  ): Promise<User | null> {
    const user = await User.findByPk(id);
    if (!user) return null;
    const allowedData = removeUndefinedFields({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      avatarUrl: userData.avatarUrl,
      dob: userData.dob,
      phoneNumber: userData.phoneNumber,
      gender: userData.gender,
      isEmailVerified: userData.isEmailVerified,
    });
    await user.update(allowedData);
    return await this.findMe(id);
  }

  async updateProfile(
    id: number,
    profileData: {
      avatarUrl?: string;
      dob?: Date;
      phoneNumber?: string;
      gender?: string;
    },
  ): Promise<User | null> {
    const user = await User.findByPk(id);
    if (!user) return null;
    const allowedData = removeUndefinedFields({
      avatarUrl: profileData.avatarUrl,
      dob: profileData.dob,
      phoneNumber: profileData.phoneNumber,
      gender: profileData.gender,
    });
    await user.update(allowedData);
    return await this.findMe(id);
  }

  async delete(id: number): Promise<boolean> {
    const deletedCount = await User.destroy({ where: { id } });
    return deletedCount > 0;
  }

  async findAvailableChiefReferees(
    offset: number = 0,
    limit: number = 10,
  ): Promise<{ referees: User[]; pagination?: any }> {
    const assignedIds = await tournamentReadService.getAssignedChiefRefereeIds();

    // If pagination is requested
    if (offset !== undefined || limit !== undefined) {
      const { count, rows } = await User.findAndCountAll({
        attributes: { exclude: ["password"] },
        include: [
          {
            model: Role,
            as: "roles",
            where: {
              name: "chief_referee",
            },
            through: { attributes: [] },
          },
        ],
        where:
          assignedIds.length > 0
            ? {
                id: {
                  [Op.notIn]: assignedIds,
                },
              }
            : {},
        offset,
        limit: limit,
        order: [["createdAt", "DESC"]],
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
          hasPrevPage: page > 1,
        },
      };
    }

    const rows = await User.findAll({
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Role,
          as: "roles",
          where: {
            name: "chief_referee",
          },
          through: { attributes: [] },
        },
      ],
      where:
        assignedIds.length > 0
          ? {
              id: {
                [Op.notIn]: assignedIds,
              },
            }
          : {},
    });

    return { referees: rows };
  }

  async uploadAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<User | null> {
    const user = await User.findByPk(userId);
    if (!user) {
      await fs.unlink(file.path); // cleanup orphan
      return null;
    }

    // Xóa avatar cũ
    if (user.avatarUrl) {
      const oldPath = path.join(
        config.upload.avatarDir,
        path.basename(user.avatarUrl),
      );
      await fs.unlink(oldPath).catch(() => {}); // ignore if not found
    }

    // Resize → webp
    const outputFilename = `${path.basename(file.filename, path.extname(file.filename))}.webp`;
    const outputPath = path.join(config.upload.avatarDir, outputFilename);

    await fs.mkdir(config.upload.avatarDir, { recursive: true });

    await sharp(file.path)
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 80 })
      .toFile(outputPath);

    await fs.unlink(file.path); // xóa file gốc

    const avatarUrl = `${config.upload.avatarUrlPath}/${outputFilename}`;
    return await user.update({ avatarUrl });
  }
}

export default new UserService();
