// Group Standing DTOs

export interface CreateGroupStandingDto {
  contentId: number;
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
  contentId: number;
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
  contentId: number;
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
  contentId: number;
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
  contentId: number;
  groupAssignments: GroupAssignmentDto[];
}

// Random Draw DTOs
export interface RandomDrawEntriesDto {
  contentId: number;
}

export interface RandomDrawAndSaveDto {
  contentId: number;
}

export interface RandomDrawResultDto {
  groupName: string;
  entryIds: number[];
}

// Query DTOs
export interface GetGroupStandingsByContentDto {
  contentId: number;
  skip?: number;
  limit?: number;
}

export interface GetGroupStandingsByGroupDto {
  contentId: number;
  groupName: string;
  skip?: number;
  limit?: number;
}
