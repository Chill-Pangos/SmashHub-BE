// match.service.ts
import { Op, Transaction } from "sequelize";
import { sequelize } from "../../../config/database";
import Match from "../models/match.model";
import MatchReferee from "../models/matchReferee.model";
import MatchSet from "../models/matchSet.model";
import SubMatch from "../models/subMatch.model";
import Schedule from "../models/schedule.model";
import KnockoutBracket from "../models/knockoutBracket.model";
import groupStandingService from "./groupStanding.service";
import knockoutBracketService from "./knockoutBracket.service";
import scheduleService from "./schedule.service";
import competitionViewService from "./competitionView.service";
import { notificationWriteService } from "../../notification/public.write";
import { registrationReadService } from "../../registration/public.read";
import {
  tournamentReadService,
  type CompetitionCategoryContext,
  type CompetitionTournamentContext,
} from "../../tournament/public.read";
import { Stage, STAGES } from "../models/schedule.model";
import { MATCH_STATUSES, MatchStatus, RESULT_STATUSES, ResultStatus } from "../models/match.model";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../../utils/errors.helper";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchWithContext {
  instance: Match;
  category: CompetitionCategoryContext;
  tournament: CompetitionTournamentContext;
}

interface CategoryMatchesFilters {
  stage?: Stage;
  status?: MatchStatus;
  resultStatus?: ResultStatus;
  offset?: number;
  limit?: number;
}

interface RefereeAssignedMatchesFilters {
  categoryId: number;
  statuses?: MatchStatus[];
  offset?: number;
  limit?: number;
}

interface MatchFinalizeSummary {
  match: Match;
  entryASubMatchWins: number;
  entryBSubMatchWins: number;
  winsToFinalize: number;
  matchReadyToFinalize: boolean;
  winnerEntryId?: number;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PaginatedMatches {
  matches: Match[];
  pagination: PaginationMeta;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MATCH_START_TIME_ZONE = "Asia/Ho_Chi_Minh";

const createMatchDetailInclude = () => [
  {
    model: Schedule,
    as: "schedule",
  },
  {
    model: MatchReferee,
    as: "matchReferees",
  },
];

const createMatchWithSubMatchesInclude = () => [
  ...createMatchDetailInclude(),
  {
    model: SubMatch,
    as: "subMatches",
    include: [{ model: MatchSet, as: "matchSets" }],
  },
];

const SUB_MATCH_ORDER: any[] = [
  [{ model: SubMatch, as: "subMatches" }, "subMatchNumber", "ASC"],
  [
    { model: SubMatch, as: "subMatches" },
    { model: MatchSet, as: "matchSets" },
    "setNumber",
    "ASC",
  ],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getMatchWithContext(
  matchId: number,
  options: { transaction?: Transaction; lock?: boolean } = {},
): Promise<MatchWithContext> {
  const queryOptions: any = {
    include: [
      {
        model: Schedule,
        as: "schedule",
      },
    ],
  };
  if (options.transaction) queryOptions.transaction = options.transaction;
  if (options.transaction && options.lock) {
    queryOptions.lock = options.transaction.LOCK.UPDATE;
  }

  const instance = await Match.findByPk(matchId, queryOptions);
  if (!instance) throw new NotFoundError("Match not found");

  const categoryId = instance.schedule?.categoryId;
  if (!categoryId) throw new NotFoundError("Match schedule or category not found");
  const category = await tournamentReadService.getCategoryCompetitionContext(categoryId);
  if (!category) throw new NotFoundError("Match schedule or category not found");

  const tournament = category.tournament;
  if (!tournament) throw new NotFoundError("Tournament not found");

  instance.schedule?.setDataValue("tournamentCategory", category);
  return { instance, category, tournament };
}

function formatCalendarDateInTimeZone(
  date: Date,
  timeZone = MATCH_START_TIME_ZONE,
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function assertMatchScheduledForToday(match: Match): void {
  const scheduledAt = match.schedule?.scheduledAt;
  if (!scheduledAt) throw new BadRequestError("Match schedule time not found");

  const scheduledDate = formatCalendarDateInTimeZone(new Date(scheduledAt));
  const currentDate = formatCalendarDateInTimeZone(new Date());

  if (scheduledDate !== currentDate) {
    throw new BadRequestError(
      `Cannot start match outside scheduled date. Scheduled date is ${scheduledDate}, current date is ${currentDate}`,
    );
  }
}

async function assertChiefReferee(
  userId: number,
  tournamentId: number,
  _transaction?: Transaction,
): Promise<void> {
  const isChief = await tournamentReadService.isTournamentReferee(
    tournamentId,
    userId,
    ["chief"],
  );
  if (!isChief) throw new ForbiddenError("Only the chief referee can perform this action");
}

async function assertMatchReferee(
  userId: number,
  matchId: number,
  transaction?: Transaction,
): Promise<void> {
  const ref = await MatchReferee.findOne({
    where: { matchId, refereeId: userId },
    ...(transaction && { transaction }),
  });
  if (!ref) throw new ForbiddenError("Only an assigned referee can perform this action");
}

async function assertTournamentReferee(
  userId: number,
  tournamentId: number,
  _transaction?: Transaction,
): Promise<void> {
  const isReferee = await tournamentReadService.isTournamentReferee(
    tournamentId,
    userId,
    ["referee", "chief"],
  );
  if (!isReferee) throw new ForbiddenError("Only a tournament referee can perform this action");
}

function countSubMatchWins(subMatches: SubMatch[]): {
  entryASubMatchWins: number;
  entryBSubMatchWins: number;
} {
  return subMatches.reduce(
    (acc, subMatch) => {
      if (subMatch.winnerTeam === "A") acc.entryASubMatchWins++;
      else if (subMatch.winnerTeam === "B") acc.entryBSubMatchWins++;
      return acc;
    },
    { entryASubMatchWins: 0, entryBSubMatchWins: 0 },
  );
}

function toMatchRealtimePayload(match: Match): Record<string, unknown> {
  return {
    id: match.id,
    scheduleId: match.scheduleId,
    entryAId: match.entryAId,
    entryBId: match.entryBId,
    status: match.status,
    winnerEntryId: match.winnerEntryId,
    resultStatus: match.resultStatus,
  };
}

function assertValidStage(stage?: string): asserts stage is Stage | undefined {
  if (stage && !STAGES.includes(stage as Stage)) {
    throw new BadRequestError(`Invalid stage. Must be one of: ${STAGES.join(", ")}`);
  }
}

function assertValidMatchStatus(
  status?: string,
): asserts status is MatchStatus | undefined {
  if (status && !MATCH_STATUSES.includes(status as MatchStatus)) {
    throw new BadRequestError(
      `Invalid match status. Must be one of: ${MATCH_STATUSES.join(", ")}`,
    );
  }
}

function assertValidMatchStatuses(statuses?: string[]): asserts statuses is MatchStatus[] | undefined {
  const invalidStatus = statuses?.find(
    (status) => !MATCH_STATUSES.includes(status as MatchStatus),
  );
  if (invalidStatus) {
    throw new BadRequestError(
      `Invalid match status "${invalidStatus}". Must be one of: ${MATCH_STATUSES.join(", ")}`,
    );
  }
}

function assertValidResultStatus(
  resultStatus?: string,
): asserts resultStatus is ResultStatus | undefined {
  if (resultStatus && !RESULT_STATUSES.includes(resultStatus as ResultStatus)) {
    throw new BadRequestError(
      `Invalid result status. Must be one of: ${RESULT_STATUSES.join(", ")}`,
    );
  }
}

async function paginateMatchIds(options: {
  where?: any;
  include?: any[];
  order?: any[];
  offset?: number;
  limit?: number;
}): Promise<{ ids: number[]; count: number }> {
  const count = (await Match.count({
    where: options.where,
    include: options.include,
    distinct: true,
    col: "id",
  } as any)) as unknown as number;

  const rows = await Match.findAll({
    where: options.where,
    include: options.include,
    attributes: ["id"],
    order: options.order,
    offset: options.offset ?? 0,
    limit: options.limit ?? 10,
    subQuery: false,
  } as any);

  return {
    ids: [...new Set(rows.map((match) => match.id))],
    count,
  };
}

function buildPagination(count: number, offset: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(count / limit);
  const page = Math.floor(offset / limit) + 1;

  return {
    total: count,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

async function loadMatchesByIds(
  ids: number[],
  include: any[],
  order: any[] = [],
): Promise<Match[]> {
  if (ids.length === 0) return [];

  const matches = await Match.findAll({
    where: { id: { [Op.in]: ids } },
    include,
    order,
  });
  const byId = new Map(matches.map((match) => [match.id, match]));

  return ids
    .map((id) => byId.get(id))
    .filter((match): match is Match => Boolean(match));
}

async function hydrateMatches(
  matches: Match[],
  options: {
    entries?: boolean;
    winner?: boolean;
    scheduleCategory?: boolean;
    refereeUsers?: boolean;
    subMatchOfficials?: boolean;
  } = {},
): Promise<void> {
  if (matches.length === 0) return;

  const includeEntries = options.entries ?? true;
  const includeWinner = options.winner ?? true;
  const includeScheduleCategory = options.scheduleCategory ?? true;
  const includeRefereeUsers = options.refereeUsers ?? true;
  const includeSubMatchOfficials = options.subMatchOfficials ?? false;

  if (includeScheduleCategory) {
    await competitionViewService.attachScheduleCategoriesToMatches(matches);
  }
  if (includeEntries) {
    await competitionViewService.attachEntriesToMatches(matches, { winner: includeWinner });
  }
  if (includeRefereeUsers) {
    await competitionViewService.attachRefereeUsersToMatches(matches);
  }
  if (includeSubMatchOfficials) {
    const subMatches = matches.flatMap((match) => (match.subMatches ?? []) as SubMatch[]);
    await competitionViewService.attachSubMatchOfficials(subMatches);
  }
}

async function getCategoryIdsForMatchFilters(filters: {
  tournamentId?: number;
  categoryId?: number;
}): Promise<number[] | undefined> {
  if (filters.categoryId) {
    if (!filters.tournamentId) return [filters.categoryId];

    const category = await tournamentReadService.getCategoryCompetitionContext(
      filters.categoryId,
    );
    return category?.tournamentId === filters.tournamentId ? [filters.categoryId] : [];
  }
  if (!filters.tournamentId) return undefined;
  return tournamentReadService.getCategoryIdsByTournamentId(filters.tournamentId);
}

async function assignUmpiresToSubMatches(
  matchId: number,
  t: Transaction,
): Promise<void> {
  const matchReferees = await MatchReferee.findAll({
    where: { matchId },
    attributes: ["refereeId"],
    order: [["id", "ASC"]],
    transaction: t,
  });

  const refereeIds = matchReferees.map((ref) => ref.refereeId);
  if (refereeIds.length === 0) return;

  const hasAssistant = refereeIds.length >= 2;
  const firstRefereeId =
    hasAssistant && Math.random() < 0.5 ? refereeIds[1]! : refereeIds[0]!;
  const secondRefereeId =
    hasAssistant && firstRefereeId === refereeIds[0]!
      ? refereeIds[1]!
      : refereeIds[0]!;

  const subMatches = await SubMatch.findAll({
    where: { matchId },
    order: [["subMatchNumber", "ASC"]],
    transaction: t,
  });

  for (const subMatch of subMatches) {
    await subMatch.update(
      {
        umpireId: firstRefereeId,
        assistantUmpireId: hasAssistant ? secondRefereeId : null,
      },
      { transaction: t },
    );
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class MatchService {
  async findById(matchId: number): Promise<Match | null> {
    const match = await Match.findByPk(matchId, {
      include: createMatchWithSubMatchesInclude(),
      order: SUB_MATCH_ORDER,
    });
    if (match) {
      await hydrateMatches([match], { subMatchOfficials: true });
    }
    return match;
  }

  async findByEntryNames(
    entryAName: string,
    entryBName: string,
    filters: { tournamentId?: number; categoryId?: number } = {},
    offset = 0,
    limit = 10,
  ): Promise<PaginatedMatches> {
    const categoryIds = await getCategoryIdsForMatchFilters(filters);
    if (categoryIds && categoryIds.length === 0) {
      return { matches: [], pagination: buildPagination(0, offset, limit) };
    }

    const [firstEntryIds, secondEntryIds] = await Promise.all([
      registrationReadService.searchCompetitionEntryIdsByName({
        name: entryAName,
        ...(categoryIds ? { categoryIds } : {}),
      }),
      registrationReadService.searchCompetitionEntryIdsByName({
        name: entryBName,
        ...(categoryIds ? { categoryIds } : {}),
      }),
    ]);
    if (firstEntryIds.length === 0 || secondEntryIds.length === 0) {
      return { matches: [], pagination: buildPagination(0, offset, limit) };
    }

    const scheduleWhere = categoryIds ? { categoryId: { [Op.in]: categoryIds } } : undefined;

    const filterInclude = [
      {
        model: Schedule,
        as: "schedule",
        ...(scheduleWhere && { where: scheduleWhere, required: true }),
      },
    ];

    const { ids, count } = await paginateMatchIds({
      where: {
        [Op.or]: [
          {
            entryAId: { [Op.in]: firstEntryIds },
            entryBId: { [Op.in]: secondEntryIds },
          },
          {
            entryAId: { [Op.in]: secondEntryIds },
            entryBId: { [Op.in]: firstEntryIds },
          },
        ],
      },
      include: filterInclude,
      offset,
      limit,
      order: [["updatedAt", "DESC"]],
    });

    const matches = await loadMatchesByIds(
      ids,
      createMatchWithSubMatchesInclude(),
      SUB_MATCH_ORDER,
    );
    await hydrateMatches(matches, { subMatchOfficials: true });

    return {
      matches,
      pagination: buildPagination(count, offset, limit),
    };
  }

  // ── 1. Bắt đầu trận ───────────────────────────────────────────────────────

  /**
   * Chuyển match sang in_progress.
   * Assign bàn thi đấu động (nếu có bàn trống).
   * Assign trọng tài động từ pool của tournament.
   */
  async startMatch(matchId: number, refereeId: number): Promise<Match> {
    const match = await sequelize.transaction(async (t) => {
      const { instance, tournament } = await getMatchWithContext(matchId, {
        transaction: t,
        lock: true,
      });
      await assertTournamentReferee(refereeId, tournament.id, t);

      if (instance.status !== "scheduled") {
        throw new BadRequestError(
          `Cannot start match. Status is "${instance.status}", must be "scheduled"`,
        );
      }
      if (!instance.entryAId || !instance.entryBId) {
        throw new BadRequestError("Cannot start match before both entries are assigned");
      }
      assertMatchScheduledForToday(instance);

      await instance.update({ status: "in_progress" }, { transaction: t });

      // Assign bàn thi đấu động (tìm bàn trống)
      await scheduleService.assignTableForMatch(matchId, tournament.id, t);

      // Assign trọng tài động (chọn người rảnh nhất)
      await scheduleService.assignRefereeDynamic(matchId, tournament.id, t);

      // Assign umpire/assistantUmpire cho các sub-match vừa có referee
      await assignUmpiresToSubMatches(matchId, t);

      return instance.reload({ transaction: t });
    });

    notificationWriteService.publishMatchRealtime(matchId, "match_started", {
      match: toMatchRealtimePayload(match),
    });

    return match;
  }

  // ── 2. Nộp kết quả (trọng tài) ────────────────────────────────────────────

  /**
   * Trọng tài nộp kết quả → status = completed, resultStatus = pending.
   * Chief referee sẽ approve sau.
   */
  async finalizeMatch(matchId: number, refereeId: number): Promise<Match> {
    const match = await sequelize.transaction(async (t) => {
      const { instance } = await getMatchWithContext(matchId, {
        transaction: t,
        lock: true,
      });
      await assertMatchReferee(refereeId, matchId, t);

      if (instance.status !== "in_progress") {
        throw new BadRequestError(
          `Cannot finalize match. Status is "${instance.status}", must be "in_progress"`,
        );
      }
      if (!instance.entryAId || !instance.entryBId) {
        throw new BadRequestError("Cannot finalize match before both entries are assigned");
      }

      const subMatches = await SubMatch.findAll({
        where: { matchId },
        order: [["subMatchNumber", "ASC"]],
        transaction: t,
      });
      if (subMatches.length === 0) throw new NotFoundError("No sub-matches found for this match");

      const { entryASubMatchWins, entryBSubMatchWins } =
        countSubMatchWins(subMatches);
      const winsToFinalize = Math.floor(subMatches.length / 2) + 1;

      if (
        entryASubMatchWins < winsToFinalize &&
        entryBSubMatchWins < winsToFinalize
      ) {
        throw new BadRequestError(
          `Match not complete. Need ${winsToFinalize} sub-match wins. Entry A: ${entryASubMatchWins}, Entry B: ${entryBSubMatchWins}`,
        );
      }

      const winnerEntryId =
        entryASubMatchWins >= winsToFinalize ? instance.entryAId : instance.entryBId;

      await instance.update({
        status: "completed",
        winnerEntryId,
        resultStatus: "pending",
      }, { transaction: t });

      return instance.reload({ transaction: t });
    });

    notificationWriteService.publishMatchRealtime(matchId, "match_result_submitted", {
      match: toMatchRealtimePayload(match),
    });

    return match;
  }

  // ── 3. Approve kết quả (chief referee) ───────────────────────────────────

  async approveMatchResult(
    matchId: number,
    chiefRefereeId: number,
    reviewNotes?: string,
  ): Promise<Match> {
    const approved = await sequelize.transaction(async (t) => {
      const { instance, tournament } = await getMatchWithContext(matchId, {
        transaction: t,
        lock: true,
      });
      await assertChiefReferee(chiefRefereeId, tournament.id, t);

      if (instance.status !== "completed") {
        throw new BadRequestError(
          `Cannot approve. Status is "${instance.status}", must be "completed"`,
        );
      }
      if (instance.resultStatus !== "pending") {
        throw new BadRequestError(
          `Cannot approve. Result status is "${instance.resultStatus}", must be "pending"`,
        );
      }
      if (!instance.winnerEntryId) {
        throw new BadRequestError("Match has no winner set");
      }

      await instance.update(
        { resultStatus: "approved", reviewNotes },
        { transaction: t },
      );

      return {
        match: await instance.reload({ transaction: t }),
        stage: instance.schedule?.stage,
        winnerEntryId: instance.winnerEntryId,
      };
    });

    if (approved.stage === "group") {
      await groupStandingService.updateStandingsAfterMatch(
        chiefRefereeId,
        matchId,
      );
    } else if (approved.stage === "knockout") {
      await knockoutBracketService.advanceWinner(
        chiefRefereeId,
        await this.getBracketIdByMatch(matchId),
        approved.winnerEntryId!,
      );
    }

    notificationWriteService.publishMatchRealtime(matchId, "match_result_approved", {
      match: toMatchRealtimePayload(approved.match),
    });

    return approved.match;
  }

  // ── 5. Pending matches (chief referee dashboard) ──────────────────────────

  async findPendingMatches(
    chiefRefereeId: number,
    tournamentId: number,
    offset = 0,
    limit = 10,
  ): Promise<PaginatedMatches> {
    await assertChiefReferee(chiefRefereeId, tournamentId);
    const categoryIds = await tournamentReadService.getCategoryIdsByTournamentId(tournamentId);
    if (categoryIds.length === 0) {
      return { matches: [], pagination: buildPagination(0, offset, limit) };
    }

    const filterInclude = [
      {
        model: Schedule,
        as: "schedule",
        required: true,
        where: { categoryId: { [Op.in]: categoryIds } },
      },
    ];

    const { ids, count } = await paginateMatchIds({
      where: { status: "completed", resultStatus: "pending" },
      include: filterInclude,
      offset,
      limit,
      order: [["updatedAt", "DESC"]],
    });

    const matches = await loadMatchesByIds(
      ids,
      [
        {
          model: Schedule,
          as: "schedule",
        },
        { model: SubMatch, as: "subMatches", include: [{ model: MatchSet, as: "matchSets" }] },
      ],
      SUB_MATCH_ORDER,
    );
    await hydrateMatches(matches, {
      entries: false,
      winner: false,
      refereeUsers: false,
    });

    return {
      matches,
      pagination: buildPagination(count, offset, limit),
    };
  }

  // ── 5.1 Category schedules & matches (chief referee dashboard) ───────────

  async findCategorySchedulesAndMatchesForChiefReferee(
    chiefRefereeId: number,
    categoryId: number,
    filters: CategoryMatchesFilters = {},
  ): Promise<PaginatedMatches> {
    assertValidStage(filters.stage);
    assertValidMatchStatus(filters.status);
    assertValidResultStatus(filters.resultStatus);

    const category = await tournamentReadService.getCategoryCompetitionContext(categoryId);
    if (!category) throw new NotFoundError("Category not found");

    await assertChiefReferee(chiefRefereeId, category.tournamentId);

    const matchWhere: Record<string, unknown> = {};
    if (filters.status) matchWhere.status = filters.status;
    if (filters.resultStatus) matchWhere.resultStatus = filters.resultStatus;

    const filterInclude = [
      {
        model: Schedule,
        as: "schedule",
        where: {
          categoryId,
          ...(filters.stage && { stage: filters.stage }),
        },
        required: true,
      },
    ];

    const { ids, count } = await paginateMatchIds({
      where: matchWhere,
      include: filterInclude,
      offset: filters.offset ?? 0,
      limit: filters.limit ?? 10,
      order: [
        [{ model: Schedule, as: "schedule" }, "scheduledAt", "ASC"],
        ["id", "ASC"],
      ],
    });

    const matches = await loadMatchesByIds(
      ids,
      createMatchWithSubMatchesInclude(),
      SUB_MATCH_ORDER,
    );
    await hydrateMatches(matches, { subMatchOfficials: true });

    return {
      matches,
      pagination: buildPagination(
        count,
        filters.offset ?? 0,
        filters.limit ?? 10,
      ),
    };
  }

  // ── 5.2 Assigned matches (referee dashboard) ─────────────────────────────

  async findAssignedMatchesForReferee(
    refereeId: number,
    filters: RefereeAssignedMatchesFilters,
  ): Promise<PaginatedMatches> {
    assertValidMatchStatuses(filters.statuses);

    const where = filters.statuses ? { status: { [Op.in]: filters.statuses } } : {};
    const filterInclude = [
      {
        model: Schedule,
        as: "schedule",
        where: { categoryId: filters.categoryId },
        required: true,
      },
      {
        model: MatchReferee,
        as: "matchReferees",
        where: { refereeId },
        required: true,
        attributes: [],
      },
    ];

    const { ids, count } = await paginateMatchIds({
      where,
      include: filterInclude,
      offset: filters.offset ?? 0,
      limit: filters.limit ?? 10,
      order: [
        ["status", "DESC"],
        ["updatedAt", "DESC"],
      ],
    });

    const matches = await loadMatchesByIds(
      ids,
      createMatchWithSubMatchesInclude(),
      SUB_MATCH_ORDER,
    );
    await hydrateMatches(matches, { subMatchOfficials: true });

    return {
      matches,
      pagination: buildPagination(
        count,
        filters.offset ?? 0,
        filters.limit ?? 10,
      ),
    };
  }

  async getPendingMatch(
    matchId: number,
    chiefRefereeId: number,
  ): Promise<{ match: Match }> {
    const { instance, tournament } = await getMatchWithContext(matchId);
    await assertChiefReferee(chiefRefereeId, tournament.id);

    if (instance.resultStatus !== "pending") {
      throw new BadRequestError(
        `Result status is "${instance.resultStatus}", must be "pending" to preview`,
      );
    }

    return { match: instance };
  }

  async getFinalizeSummary(
    matchId: number,
    refereeId: number,
  ): Promise<MatchFinalizeSummary> {
    await assertMatchReferee(refereeId, matchId);

    const match = await Match.findByPk(matchId, {
      include: createMatchWithSubMatchesInclude(),
      order: SUB_MATCH_ORDER,
    });
    if (!match) throw new NotFoundError("Match not found");
    await hydrateMatches([match], { winner: false, subMatchOfficials: true });

    const subMatches = match.subMatches ?? [];
    const { entryASubMatchWins, entryBSubMatchWins } =
      countSubMatchWins(subMatches);
    const winsToFinalize = Math.floor(subMatches.length / 2) + 1;
    const matchReadyToFinalize =
      entryASubMatchWins >= winsToFinalize ||
      entryBSubMatchWins >= winsToFinalize;
    const winnerEntryId = entryASubMatchWins >= winsToFinalize
      ? match.entryAId
      : entryBSubMatchWins >= winsToFinalize
        ? match.entryBId
        : undefined;

    return {
      match,
      entryASubMatchWins,
      entryBSubMatchWins,
      winsToFinalize,
      matchReadyToFinalize,
      ...(winnerEntryId && { winnerEntryId }),
    };
  }

  // ── 6. Upcoming & history cho athlete ────────────────────────────────────

  async findUpcomingMatchesByAthlete(
    userId: number,
    offset = 0,
    limit = 10,
  ): Promise<PaginatedMatches> {
    const entryIds = await this.getEntryIdsByUser(userId);
    if (entryIds.length === 0) {
      return { matches: [], pagination: buildPagination(0, offset, limit) };
    }

    const where = {
      [Op.or]: [
        { entryAId: { [Op.in]: entryIds } },
        { entryBId: { [Op.in]: entryIds } },
      ],
      status: { [Op.in]: ["scheduled", "in_progress"] },
    };

    const { ids, count } = await paginateMatchIds({
      where,
      include: [
        {
          model: Schedule,
          as: "schedule",
          required: true,
        },
      ],
      offset,
      limit,
      order: [[{ model: Schedule, as: "schedule" }, "scheduledAt", "ASC"]],
    });

    const matches = await loadMatchesByIds(ids, createMatchDetailInclude());
    await hydrateMatches(matches, { winner: false });

    return {
      matches,
      pagination: buildPagination(count, offset, limit),
    };
  }

  async findMatchHistoryByAthlete(
    userId: number,
    offset = 0,
    limit = 10,
  ): Promise<PaginatedMatches> {
    const entryIds = await this.getEntryIdsByUser(userId);
    if (entryIds.length === 0) {
      return { matches: [], pagination: buildPagination(0, offset, limit) };
    }

    const where = {
      [Op.or]: [
        { entryAId: { [Op.in]: entryIds } },
        { entryBId: { [Op.in]: entryIds } },
      ],
      status: "completed",
      resultStatus: "approved",
    };

    const { ids, count } = await paginateMatchIds({
      where,
      offset,
      limit,
      order: [["updatedAt", "DESC"]],
    });

    const matches = await loadMatchesByIds(
      ids,
      createMatchWithSubMatchesInclude(),
      SUB_MATCH_ORDER,
    );
    await hydrateMatches(matches, { subMatchOfficials: true });

    return {
      matches,
      pagination: buildPagination(count, offset, limit),
    };
  }

  /**
   * Bắt đầu nhiều trận cùng lúc.
   * Dùng khi tournament có nhiều bàn thi đấu chạy song song.
   * Mỗi trận vẫn assign bàn và trọng tài động độc lập.
   * Trận nào fail sẽ ghi vào errors, không rollback toàn bộ.
   */
  async bulkStartMatches(
    refereeId: number,
    matchIds: number[],
  ): Promise<{
    succeeded: Match[];
    failed: { matchId: number; reason: string }[];
  }> {
    if (matchIds.length === 0) throw new BadRequestError("matchIds must not be empty");

    const succeeded: Match[] = [];
    const failed: { matchId: number; reason: string }[] = [];

    for (const matchId of matchIds) {
      try {
        const match = await this.startMatch(matchId, refereeId);
        succeeded.push(match);
      } catch (err) {
        failed.push({
          matchId,
          reason: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return { succeeded, failed };
  }

  // ── Helpers nội bộ ────────────────────────────────────────────────────────

  private async getEntryIdsByUser(userId: number): Promise<number[]> {
    return registrationReadService.getCompetitionEntryIdsByUserId(userId);
  }

  private async getBracketIdByMatch(matchId: number): Promise<number> {
    const bracket = await KnockoutBracket.findOne({
      where: { matchId },
      attributes: ["id"],
    });
    if (!bracket) throw new Error("Knockout bracket not found for this match");
    return bracket.id;
  }
}

export default new MatchService();
