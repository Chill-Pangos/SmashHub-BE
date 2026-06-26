import knockoutBracketService from "./knockoutBracket.service";

export class CompetitionWriteService {
  generateKnockoutBracketForCategory(
    chiefRefereeId: number,
    categoryId: number,
    previewEntryIds?: number[],
  ): Promise<unknown> {
    return knockoutBracketService.saveAssignments(chiefRefereeId, categoryId, previewEntryIds);
  }
}

export default new CompetitionWriteService();
