// Tournament Referee DTOs
export interface CreateTournamentRefereeDto {
  tournamentId: number;
  refereeId: number;
  role: "main" | "assistant";
}

export interface UpdateTournamentRefereeDto {
  role?: "main" | "assistant";
  isAvailable?: boolean;
}

export interface TournamentRefereeResponseDto {
  id: number;
  tournamentId: number;
  refereeId: number;
  role: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  referee?: {
    id: number;
    username: string;
    email: string;
    fullName?: string;
  };
}

export interface AssignRefereeDto {
  refereeIds: number[];
  tournamentId: number;
}
