import type { Transaction } from "sequelize";
import EloScore from "../models/eloScore.model";
import eloCalculationService from "./eloCalculation.service";
import type { TournamentEloUpdateResult, UserEloView } from "../public.contracts";

const DEFAULT_ELO = 1000;

export class RankingWriteService {
  async createInitialUserElo(
    userId: number,
    options: { transaction?: Transaction; score?: number } = {},
  ): Promise<UserEloView> {
    const createOptions = options.transaction ? { transaction: options.transaction } : {};
    const score = await EloScore.create(
      {
        userId,
        score: options.score ?? DEFAULT_ELO,
      } as any,
      createOptions,
    );

    return score.get({ plain: true }) as UserEloView;
  }

  async updateEloForTournament(tournamentId: number): Promise<TournamentEloUpdateResult> {
    return eloCalculationService.updateEloForTournament(tournamentId);
  }
}

export default new RankingWriteService();
