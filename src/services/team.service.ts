import Team from "../models/team.model";
import TeamMember from "../models/teamMember.model";
import { CreateTeamDto, UpdateTeamDto, CreateTeamWithMembersDto } from "../dto/team.dto";
import { withTransaction } from "../utils/transaction.helper";
import { QueryHelper } from "../utils/query.helper";

export class TeamService {
  async create(data: CreateTeamDto): Promise<Team> {
    return await Team.create(data as any);
  }

  async findAll(skip = 0, limit = 10): Promise<Team[]> {
    return await Team.findAll({
      offset: skip,
      limit,
      include: QueryHelper.teamWithMembers(),
    });
  }

  async findById(id: number): Promise<Team | null> {
    return await Team.findByPk(id, {
      include: QueryHelper.teamWithMembers(),
    });
  }

  async findByTournamentId(
    tournamentId: number,
    skip = 0,
    limit = 10
  ): Promise<Team[]> {
    return await Team.findAll({
      where: { tournamentId },
      offset: skip,
      limit,
      include: QueryHelper.teamWithMembers(),
    });
  }

  async update(id: number, data: UpdateTeamDto): Promise<[number, Team[]]> {
    return await Team.update(data, {
      where: { id },
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return await Team.destroy({ where: { id } });
  }
}

export default new TeamService();
