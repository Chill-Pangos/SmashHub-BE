import Schedule from "../models/schedule.model";
import Match from "../models/match.model";
import Entry from "../models/entry.model";
import { Op } from "sequelize";

export class ScheduleService {
  /**
   * Create schedule entry
   */
  async create(data: {
    matchId: number;
    tableNumber?: number;
    scheduledTime?: Date;
    status?: string;
  }): Promise<Schedule> {
    return await Schedule.create(data);
  }

  /**
   * Find all schedules with pagination
   */
  async findAll(skip: number = 0, limit: number = 10): Promise<{
    schedules: Schedule[];
    total: number;
  }> {
    const [schedules, total] = await Promise.all([
      Schedule.findAll({
        include: [
          {
            model: Match,
            as: 'match',
            include: [
              {
                model: Entry,
                as: 'entryA'
              },
              {
                model: Entry,
                as: 'entryB'
              }
            ]
          }
        ],
        order: [['scheduledTime', 'ASC']],
        offset: skip,
        limit
      }),
      Schedule.count()
    ]);

    return { schedules, total };
  }

  /**
   * Get schedule by ID
   */
  async findById(id: number): Promise<Schedule | null> {
    return await Schedule.findByPk(id, {
      include: [
        {
          model: Match,
          as: 'match',
          include: [
            {
              model: Entry,
              as: 'entryA'
            },
            {
              model: Entry,
              as: 'entryB'
            }
          ]
        }
      ]
    });
  }

  /**
   * Update schedule
   */
  async update(id: number, data: Partial<Schedule>): Promise<void> {
    await Schedule.update(data, {
      where: { id }
    });
  }

  /**
   * Delete schedule
   */
  async delete(id: number): Promise<void> {
    await Schedule.destroy({
      where: { id }
    });
  }

  /**
   * Generate group stage schedule
   */
  async generateGroupStageSchedule(categoryId: number, startDate: Date): Promise<{
    schedules: Schedule[];
    matches: any[];
  }> {
    // Placeholder implementation - in real system would:
    // 1. Get all group stage matches for this category
    // 2. Allocate time slots and tables
    // 3. Create schedule entries

    return {
      schedules: [],
      matches: []
    };
  }

  /**
   * Generate complete schedule (group + knockout)
   */
  async generateCompleteSchedule(categoryId: number, startDate: Date): Promise<{
    schedules: Schedule[];
    matches: any[];
  }> {
    return {
      schedules: [],
      matches: []
    };
  }

  /**
   * Generate knockout only schedule
   */
  async generateKnockoutOnlySchedule(categoryId: number, startDate: Date): Promise<{
    schedules: Schedule[];
    matches: any[];
  }> {
    return {
      schedules: [],
      matches: []
    };
  }

  /**
   * Generate knockout stage schedule
   */
  async generateKnockoutStageSchedule(categoryId: number, startDate: Date): Promise<{
    schedules: Schedule[];
    matches: any[];
  }> {
    return {
      schedules: [],
      matches: []
    };
  }

  /**
   * Find schedules by category ID
   */
  async findSchedulesByCategoryId(categoryId: number, skip: number = 0, limit: number = 100): Promise<{
    schedules: Schedule[];
    total: number;
  }> {
    const [schedules, total] = await Promise.all([
      Schedule.findAll({
        include: [
          {
            model: Match,
            as: 'match',
            include: [
              {
                model: Entry,
                as: 'entryA',
                where: { categoryId }
              },
              {
                model: Entry,
                as: 'entryB'
              }
            ]
          }
        ],
        order: [['scheduledTime', 'ASC']],
        offset: skip,
        limit
      }),
      Schedule.count({
        include: [
          {
            model: Match,
            as: 'match',
            include: [
              {
                model: Entry,
                as: 'entryA',
                where: { categoryId }
              }
            ]
          }
        ]
      })
    ]);

    return { schedules, total };
  }
}

// Export default instance
export default new ScheduleService();
