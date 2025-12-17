import Schedule from "../models/schedule.model";
import { CreateScheduleDto, UpdateScheduleDto } from "../dto/schedule.dto";

export class ScheduleService {
  async create(data: CreateScheduleDto): Promise<Schedule> {
    return await Schedule.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<Schedule[]> {
    return await Schedule.findAll({
      offset: skip,
      limit,
      order: [["scheduledAt", "ASC"]],
    });
  }

  async findById(id: number): Promise<Schedule | null> {
    return await Schedule.findByPk(id);
  }

  async findByContentId(
    contentId: number,
    skip = 0,
    limit = 10
  ): Promise<Schedule[]> {
    return await Schedule.findAll({
      where: { contentId },
      offset: skip,
      limit,
      order: [["scheduledAt", "ASC"]],
    });
  }

  async update(
    id: number,
    data: UpdateScheduleDto
  ): Promise<[number, Schedule[]]> {
    return await Schedule.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await Schedule.destroy({ where: { id } });
  }
}

export default new ScheduleService();
