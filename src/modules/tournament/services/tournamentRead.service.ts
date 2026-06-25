import type { TournamentForElo } from "../public.contracts";
import Tournament from "../models/tournament.model";

export class TournamentReadService {
  async getTournamentForElo(tournamentId: number): Promise<TournamentForElo | null> {
    const tournament = await Tournament.findByPk(tournamentId, {
      attributes: ["id", "tier", "status"],
    });
    if (!tournament) return null;

    return {
      id: tournament.id,
      tier: tournament.tier,
      status: tournament.status,
    };
  }
}

export default new TournamentReadService();
