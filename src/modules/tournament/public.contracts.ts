import type { TournamentStatus } from "./models/tournament.model";

export interface TournamentForElo {
  id: number;
  tier: number;
  status: TournamentStatus;
}
