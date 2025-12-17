// ContentRule DTOs
export interface CreateContentRuleDto {
  contentId: number;
  matchFormatId?: number;
  maxEntries: number;
  maxSets: number;
  racketCheck: boolean;
  isGroupStage?: boolean;
}

export interface UpdateContentRuleDto {
  matchFormatId?: number;
  maxEntries?: number;
  maxSets?: number;
  racketCheck?: boolean;
  isGroupStage?: boolean;
}

export interface ContentRuleResponseDto {
  id: number;
  contentId: number;
  matchFormatId?: number;
  maxEntries: number;
  maxSets: number;
  racketCheck: boolean;
  isGroupStage?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
