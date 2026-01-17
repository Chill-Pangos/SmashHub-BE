import TeamMember from "../models/teamMember.model";
import { CreateTeamMemberDto, UpdateTeamMemberDto } from "../dto/teamMember.dto";

export class TeamMemberService {
  async create(data: CreateTeamMemberDto): Promise<TeamMember> {
    return await TeamMember.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<TeamMember[]> {
    return await TeamMember.findAll({
      offset: skip,
      limit,
    });
  }

  async findById(id: number): Promise<TeamMember | null> {
    return await TeamMember.findByPk(id);
  }

  async findByTeamId(
    teamId: number,
    skip = 0,
    limit = 10
  ): Promise<TeamMember[]> {
    return await TeamMember.findAll({
      where: { teamId },
      offset: skip,
      limit,
    });
  }

  async findByUserId(
    userId: number,
    skip = 0,
    limit = 10
  ): Promise<TeamMember[]> {
    return await TeamMember.findAll({
      where: { userId },
      offset: skip,
      limit,
    });
  }

  async update(id: number, data: UpdateTeamMemberDto): Promise<[number, TeamMember[]]> {
    return await TeamMember.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await TeamMember.destroy({ where: { id } });
  }
}

export default new TeamMemberService();
