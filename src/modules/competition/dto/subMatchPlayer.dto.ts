// SubMatchPlayer DTOs
export interface CreateSubMatchPlayerDto {
  subMatchId: number;
  entryMemberId: number;
  team: "A" | "B";
}

export interface UpdateSubMatchPlayerDto {
  team?: "A" | "B";
}

export interface SubMatchPlayerResponseDto {
  id: number;
  subMatchId: number;
  entryMemberId: number;
  team: "A" | "B";
  createdAt: Date;
  updatedAt: Date;
}
