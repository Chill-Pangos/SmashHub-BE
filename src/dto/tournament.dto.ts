// Tournament DTOs
export interface CreateTournamentDto {
  name: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  status?: "upcoming" | "ongoing" | "completed";
  createdBy: number;
  contents?: CreateTournamentContentWithRuleDto[];
}

export interface CreateTournamentContentWithRuleDto {
  name: string;
  formatTypeId: number;
  contentRule: {
    matchFormatId?: number;
    maxEntries: number;
    maxSets: number;
    racketCheck: boolean;
    isGroupStage?: boolean;
  };
}

export interface UpdateTournamentDto {
  name?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  status?: "upcoming" | "ongoing" | "completed";
}

export interface TournamentResponseDto {
  id: number;
  name: string;
  status: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}
