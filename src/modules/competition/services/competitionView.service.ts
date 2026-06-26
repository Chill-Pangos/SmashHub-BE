import Match from "../models/match.model";
import MatchReferee from "../models/matchReferee.model";
import Schedule from "../models/schedule.model";
import SubMatch from "../models/subMatch.model";
import SubMatchPlayer from "../models/subMatchPlayer.model";
import { identityReadService, type TournamentUserSummary } from "../../identity/public.read";
import {
  registrationReadService,
  type CompetitionEntryMemberSummary,
  type CompetitionEntrySummary,
  type CompetitionEntryWithMembers,
} from "../../registration/public.read";
import {
  tournamentReadService,
  type CompetitionCategoryContext,
} from "../../tournament/public.read";

type PublicCompetitionUser = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  avatarUrl?: string;
  gender?: "male" | "female";
};

type EntryMemberView = CompetitionEntryMemberSummary & {
  user?: PublicCompetitionUser | null;
};

type EntryView = CompetitionEntrySummary & {
  members?: EntryMemberView[];
};

class CompetitionViewService {
  async attachEntriesToMatches(
    matches: Match[],
    options: { members?: boolean; winner?: boolean } = {},
  ): Promise<void> {
    const includeMembers = options.members ?? true;
    const includeWinner = options.winner ?? true;
    const entryIds = new Set<number>();

    for (const match of matches) {
      if (match.entryAId != null) entryIds.add(match.entryAId);
      if (match.entryBId != null) entryIds.add(match.entryBId);
      if (includeWinner && match.winnerEntryId != null) entryIds.add(match.winnerEntryId);
    }

    const entryById = await this.getEntryViews([...entryIds], includeMembers);
    for (const match of matches) {
      match.setDataValue(
        "entryA",
        match.entryAId != null ? entryById.get(match.entryAId) ?? null : null,
      );
      match.setDataValue(
        "entryB",
        match.entryBId != null ? entryById.get(match.entryBId) ?? null : null,
      );
      if (includeWinner) {
        match.setDataValue(
          "winnerEntry",
          match.winnerEntryId != null ? entryById.get(match.winnerEntryId) ?? null : null,
        );
      }
    }
  }

  async attachEntriesToSchedules(schedules: Schedule[]): Promise<void> {
    const matches = schedules.flatMap((schedule) =>
      ((schedule.scheduledMatches ?? []) as Match[]),
    );
    await this.attachEntriesToMatches(matches, { members: false, winner: false });
  }

  async attachCategoriesToSchedules(schedules: Schedule[]): Promise<void> {
    const categoryIds = Array.from(new Set(schedules.map((schedule) => schedule.categoryId)));
    const categories = await tournamentReadService.getCategoriesCompetitionContext(categoryIds);
    const categoryById = new Map(categories.map((category) => [category.id, category]));

    for (const schedule of schedules) {
      schedule.setDataValue(
        "tournamentCategory",
        categoryById.get(schedule.categoryId) ?? null,
      );
    }
  }

  async attachScheduleCategoriesToMatches(matches: Match[]): Promise<void> {
    const schedules = matches
      .map((match) => match.schedule as Schedule | undefined)
      .filter((schedule): schedule is Schedule => Boolean(schedule));
    await this.attachCategoriesToSchedules(schedules);
  }

  async attachRefereeUsersToMatches(matches: Match[]): Promise<void> {
    const refs = matches.flatMap((match) =>
      ((match.matchReferees ?? []) as MatchReferee[]),
    );
    await this.attachRefereeUsers(refs);
  }

  async attachRefereeUsers(refs: MatchReferee[]): Promise<void> {
    const users = await identityReadService.getTournamentUsersByIds(
      refs.map((ref) => ref.refereeId),
    );
    const userById = new Map(
      users.map((user) => [user.id, this.toPublicUser(user, { includeEmail: true })]),
    );

    for (const ref of refs) {
      ref.setDataValue("referee", userById.get(ref.refereeId) ?? null);
    }
  }

  async attachSubMatchOfficials(subMatches: SubMatch[]): Promise<void> {
    const userIds = new Set<number>();
    for (const subMatch of subMatches) {
      if (subMatch.umpireId != null) userIds.add(subMatch.umpireId);
      if (subMatch.assistantUmpireId != null) userIds.add(subMatch.assistantUmpireId);
    }

    const users = await identityReadService.getTournamentUsersByIds([...userIds]);
    const userById = new Map(users.map((user) => [user.id, this.toPublicUser(user)]));

    for (const subMatch of subMatches) {
      subMatch.setDataValue(
        "umpire",
        subMatch.umpireId != null ? userById.get(subMatch.umpireId) ?? null : null,
      );
      subMatch.setDataValue(
        "assistantUmpire",
        subMatch.assistantUmpireId != null
          ? userById.get(subMatch.assistantUmpireId) ?? null
          : null,
      );
    }
  }

  async attachEntryMembersToSubMatchPlayers(players: SubMatchPlayer[]): Promise<void> {
    const members = await registrationReadService.getCompetitionEntryMembersByIds(
      players.map((player) => player.entryMemberId),
    );
    const memberViews = await this.withMemberUsers(members);
    const memberById = new Map(memberViews.map((member) => [member.id, member]));

    for (const player of players) {
      player.setDataValue("entryMember", memberById.get(player.entryMemberId) ?? null);
    }
  }

  private async getEntryViews(entryIds: number[], includeMembers: boolean): Promise<Map<number, EntryView>> {
    if (entryIds.length === 0) return new Map();

    if (!includeMembers) {
      const entries = await registrationReadService.getCompetitionEntriesByIds(entryIds);
      return new Map(entries.map((entry) => [entry.id, entry]));
    }

    const entries = await registrationReadService.getCompetitionEntriesWithMembersByIds(entryIds);
    const memberViews = await this.withMemberUsers(entries.flatMap((entry) => entry.members));
    const membersByEntryId = new Map<number, EntryMemberView[]>();
    for (const member of memberViews) {
      const group = membersByEntryId.get(member.entryId) ?? [];
      group.push(member);
      membersByEntryId.set(member.entryId, group);
    }

    return new Map(entries.map((entry) => [
      entry.id,
      {
        ...entry,
        members: membersByEntryId.get(entry.id) ?? [],
      },
    ]));
  }

  private async withMemberUsers(
    members: CompetitionEntryMemberSummary[],
  ): Promise<EntryMemberView[]> {
    const users = await identityReadService.getTournamentUsersByIds(
      members.map((member) => member.userId),
    );
    const userById = new Map(users.map((user) => [user.id, this.toPublicUser(user)]));

    return members.map((member) => ({
      ...member,
      user: userById.get(member.userId) ?? null,
    }));
  }

  private toPublicUser(
    user: TournamentUserSummary,
    options: { includeEmail?: boolean } = {},
  ): PublicCompetitionUser {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      ...(options.includeEmail ? { email: user.email } : {}),
      ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
      ...(user.gender ? { gender: user.gender } : {}),
    };
  }
}

export default new CompetitionViewService();
