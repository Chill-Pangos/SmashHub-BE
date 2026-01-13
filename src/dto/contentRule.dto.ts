// ContentRule DTOs
export interface CreateContentRuleDto {
  contentId: number;
  maxEntries: number;
  maxSets: number;
  numberOfSingles?: number;
  numberOfDoubles?: number;
  racketCheck: boolean;
  isGroupStage?: boolean;
}

export interface UpdateContentRuleDto {
  maxEntries?: number;
  maxSets?: number;
  numberOfSingles?: number;
  numberOfDoubles?: number;
  racketCheck?: boolean;
  isGroupStage?: boolean;
}

export interface ContentRuleResponseDto {
  id: number;
  contentId: number;
  maxEntries: number;
  maxSets: number;
  numberOfSingles?: number;
  numberOfDoubles?: number;
  racketCheck: boolean;
  isGroupStage?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
