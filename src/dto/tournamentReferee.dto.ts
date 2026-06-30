// Tournament Referee DTOs
export interface CreateTournamentRefereeDto {
  tournamentId: number;
  refereeId: number;
  role: "chief" | "referee";
}

export interface UpdateTournamentRefereeDto {
  role?: "chief" | "referee";
  isAvailable?: boolean;
}

export interface TournamentRefereeResponseDto {
  id: number;
  tournamentId: number;
  refereeId: number;
  role: "chief" | "referee";
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  referee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface AssignRefereeDto {
  refereeIds: number[];
  tournamentId: number;
}
