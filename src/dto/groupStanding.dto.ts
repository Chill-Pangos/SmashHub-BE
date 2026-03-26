// Group Standing DTOs

export interface CreateGroupStandingDto {
  categoryId: number;
  groupName: string;
  entryId: number;
}

export interface UpdateGroupStandingDto {
  groupName?: string;
  matchesPlayed?: number;
  matchesWon?: number;
  matchesLost?: number;
  setsWon?: number;
  setsLost?: number;
  setsDiff?: number;
  position?: number;
}

export interface GroupStandingDto {
  id: number;
  categoryId: number;
  groupName: string;
  entryId: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  setsDiff: number;
  position?: number;
}

export interface CalculateStandingsDto {
  categoryId: number;
  groupName?: string; // Calculate for specific group or all groups if not provided
}

export interface GroupStandingsResponseDto {
  groupName: string;
  standings: GroupStandingDto[];
}

// Group Configuration DTOs
export interface GroupConfigDto {
  numGroups: number;
  teamsPerGroup: number[];
  totalSlots: number;
}

export interface CalculateOptimalGroupsDto {
  totalEntries: number;
}

// Group Placeholder DTOs
export interface GenerateGroupPlaceholdersDto {
  categoryId: number;
  numberOfGroups: number;
  maxEntriesPerGroup: number;
}

export interface GroupPlaceholderDto {
  groupName: string;
  slots: number;
  entries: any[];
  description: string;
}

// Group Assignment DTOs
export interface GroupAssignmentDto {
  groupName: string;
  entryIds: number[];
}

export interface SaveGroupAssignmentsDto {
  categoryId: number;
  groupAssignments: Array<{ groupName: string; entryIds: number[] }>;
}

// Random Draw DTOs
export interface RandomDrawEntriesDto {
  categoryId: number;
  entries: number[];
  numberOfGroups: number;
}

export interface RandomDrawAndSaveDto {
  categoryId: number;
  entries: number[];
  numberOfGroups: number;
}

export interface RandomDrawResultDto {
  groupName: string;
  entryIds: number[];
}

// Query DTOs
export interface GetGroupStandingsByCategoryDto {
  categoryId: number;
  skip?: number;
  limit?: number;
}

export interface GetGroupStandingsByGroupDto {
  categoryId: number;
  groupName: string;
  skip?: number;
  limit?: number;
}
