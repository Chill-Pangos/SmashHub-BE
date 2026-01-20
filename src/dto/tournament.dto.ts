// Tournament DTOs
export interface CreateTournamentDto {
  name: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  status?: "upcoming" | "ongoing" | "completed";
  createdBy: number;
  numberOfTables?: number;
  contents?: CreateTournamentContentDto[];
}

export interface CreateTournamentContentDto {
  name: string;
  type: 'single' | 'team' | 'double';
  maxEntries: number;
  maxSets: number;
  numberOfSingles?: number;
  numberOfDoubles?: number;
  minAge?: number;
  maxAge?: number;
  minElo?: number;
  maxElo?: number;

  gender?: 'male' | 'female' | 'mixed';
  isGroupStage?: boolean;
}

export interface UpdateTournamentDto {
  name?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  status?: "upcoming" | "ongoing" | "completed";
  numberOfTables?: number;
  contents?: UpdateTournamentContentDto[];
}

export interface UpdateTournamentContentDto {
  name: string;
  type: 'single' | 'team' | 'double';
  maxEntries: number;
  maxSets: number;
  numberOfSingles?: number;
  numberOfDoubles?: number;
  minAge?: number;
  maxAge?: number;
  minElo?: number;
  maxElo?: number;
  gender?: 'male' | 'female' | 'mixed';
  isGroupStage?: boolean;
}

export interface TournamentResponseDto {
  id: number;
  name: string;
  status: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  numberOfTables: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentFilterDto {
  userId?: number | undefined;
  createdBy?: number | undefined;
  minAge?: number | undefined;
  maxAge?: number | undefined;
  minElo?: number | undefined;
  maxElo?: number | undefined;
  gender?: 'male' | 'female' | 'mixed' | undefined;
  isGroupStage?: boolean | undefined;
  skip?: number;
  limit?: number;
}

export interface TournamentPaginatedResponseDto {
  tournaments: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
