import Match from "./competition/models/match.model";
import Schedule from "./competition/models/schedule.model";
import SubMatch from "./competition/models/subMatch.model";
import Entry from "./registration/models/entry.model";
import EntryMember from "./registration/models/entryMember.model";
import TournamentCategory from "./tournament/models/tournamentCategory.model";

export function validateTournamentEloIncludeGraph(): void {
  (Match as any)._validateIncludedElements({
    include: [
      {
        model: Schedule,
        as: "schedule",
        required: true,
        include: [{
          model: TournamentCategory,
          as: "tournamentCategory",
          where: { tournamentId: 1 },
          required: true,
        }],
      },
      { model: SubMatch, as: "subMatches", attributes: ["winnerTeam"] },
      {
        model: Entry,
        as: "entryA",
        include: [{ model: EntryMember, as: "members", attributes: ["userId"] }],
      },
      {
        model: Entry,
        as: "entryB",
        include: [{ model: EntryMember, as: "members", attributes: ["userId"] }],
      },
    ],
  });
}
