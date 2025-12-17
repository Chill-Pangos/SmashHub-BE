import Profile from "../models/profile.model";
import { CreateProfileDto, UpdateProfileDto } from "../dto/profile.dto";

export class ProfileService {
  async create(data: CreateProfileDto): Promise<Profile> {
    return await Profile.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<Profile[]> {
    return await Profile.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<Profile | null> {
    return await Profile.findByPk(id);
  }

  async findByUserId(userId: number): Promise<Profile | null> {
    return await Profile.findOne({ where: { userId } });
  }

  async update(
    id: number,
    data: UpdateProfileDto
  ): Promise<[number, Profile[]]> {
    return await Profile.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await Profile.destroy({ where: { id } });
  }
}

export default new ProfileService();
