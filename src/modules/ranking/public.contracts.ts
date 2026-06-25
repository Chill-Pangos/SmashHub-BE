export interface TournamentEloChange {
  userId: number;
  currentElo: number;
  finalElo: number;
  totalDelta: number;
}

export interface TournamentEloUpdateResult {
  tournamentId: number;
  totalMatches: number;
  tierMultiplier: number;
  historyRecordsCreated: number;
  changes: TournamentEloChange[];
}

export interface UserEloSnapshot {
  userId: number;
  score: number;
}

export interface UserEloView {
  id: number;
  userId: number;
  score: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
