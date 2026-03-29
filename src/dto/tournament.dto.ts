// Tournament DTOs
export interface CreateTournamentDto {
  name: string;
  tier: number;
  startDate: Date;
  endDate?: Date;
  registrationStartDate?: Date;
  registrationEndDate?: Date;
  bracketGenerationDate?: Date;
  location: string;
  status?: "upcoming" | "ongoing" | "completed" | "registration_open" | "registration_closed" | "brackets_generated" | "cancelled";
  createdBy: number;
  numberOfTables?: number;
  categories?: CreateTournamentCategoryDto[];
}

export interface CreateTournamentCategoryDto {
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
  tier?: number;
  startDate?: Date;
  endDate?: Date;
  registrationStartDate?: Date;
  registrationEndDate?: Date;
  bracketGenerationDate?: Date;
  location?: string;
  status?: "upcoming" | "ongoing" | "completed" | "registration_open" | "registration_closed" | "brackets_generated" | "cancelled";
  numberOfTables?: number;
  categories?: UpdateTournamentCategoryDto[];
}

export interface UpdateTournamentCategoryDto {
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
  tier: number;
  status: "upcoming" | "registration_open" | "registration_closed" | "brackets_generated" | "ongoing" | "completed" | "cancelled";
  startDate: Date;
  endDate?: Date;
  registrationStartDate?: Date;
  registrationEndDate?: Date;
  bracketGenerationDate?: Date;
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
  status?: "upcoming" | "registration_open" | "registration_closed" | "brackets_generated" | "ongoing" | "completed" | "cancelled" | undefined;
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
