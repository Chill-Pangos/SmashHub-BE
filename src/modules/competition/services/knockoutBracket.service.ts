// knockoutBracket.service.ts
import { Op, Transaction } from "sequelize";
import { sequelize } from "../../../config/database";
import KnockoutBracket, {
  BracketStatus,
} from "../models/knockoutBracket.model";
import {
  tournamentReadService,
  type CompetitionCategoryContext,
  type CompetitionTournamentContext,
} from "../../tournament/public.read";
import { registrationReadService } from "../../registration/public.read";
import GroupStanding from "../models/groupStanding.model";
import groupStandingService from "./groupStanding.service";
import { KnockoutRound } from "../models/schedule.model";
import ScheduleConfig from "../models/scheduleConfig.model";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BracketSlotDto {
  entryId: number | null;
  entryName: string; // "TBD" nếu chưa có entryId
}

interface BracketDto {
  id: number;
  roundNumber: number;
  roundName: string;
  bracketPosition: number;
  entryA: BracketSlotDto;
  entryB: BracketSlotDto;
  winnerEntryId: number | null;
  status: BracketStatus;
  isByeMatch: boolean;
  previousBracketAId: number | null;
  previousBracketBId: number | null;
  nextBracketId: number | null;
}

interface RoundDto {
  roundNumber: number;
  roundName: string;
  brackets: BracketDto[];
}

interface BracketTreeDto {
  categoryId: number;
  totalRounds: number;
  totalBrackets: number;
  rounds: RoundDto[];
}

interface BracketPreviewResponse {
  entryIds: number[];
  bracketTree: BracketTreeDto;
}

interface QualifierGroup {
  groupName: string;
  qualifiers: GroupStanding[];
}

interface QualifierSeed {
  entryId: number;
  groupName: string;
  rank: 1 | 2;
}

interface QualifierSeedCandidate {
  entryIds: number[];
  keepsGroupsInOppositeHalves: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUALIFIERS_PER_GROUP = 2;
const MIN_ENTRIES = 4;
const MAX_BRACKET_SIZE = 256;
const POSSIBLE_BRACKET_SIZES = [4, 8, 16, 32, 64, 128, 256];

const ROUND_NAME_MAP: Record<number, KnockoutRound> = {
  2: "Final",
  4: "Semi-final",
  8: "Quarter-final",
  16: "Round of 16",
  32: "Round of 32",
  64: "Round of 64",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSlot(
  entryId: number | null | undefined,
  entryName: string | null | undefined,
): BracketSlotDto {
  if (entryId == null) {
    return { entryId: null, entryName: "TBD" };
  }
  return { entryId, entryName: entryName ?? "TBD" };
}

function formatBracket(b: KnockoutBracket): BracketDto {
  return {
    id: b.id,
    roundNumber: b.roundNumber,
    roundName: b.roundName,
    bracketPosition: b.bracketPosition,
    entryA: formatSlot(b.entryAId, b.entryA?.name),
    entryB: formatSlot(b.entryBId, b.entryB?.name),
    winnerEntryId: b.winnerEntryId ?? null,
    status: b.status,
    isByeMatch: b.isByeMatch,
    previousBracketAId: b.previousBracketAId ?? null,
    previousBracketBId: b.previousBracketBId ?? null,
    nextBracketId: b.nextBracketId ?? null,
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

function assertSameEntrySet(actual: number[], expected: number[]): void {
  if (actual.length !== expected.length) {
    throw new Error("entryIds do not match the previewable entries");
  }

  const actualSorted = [...actual].sort((a, b) => a - b);
  const expectedSorted = [...expected].sort((a, b) => a - b);

  for (let i = 0; i < expectedSorted.length; i++) {
    if (actualSorted[i] !== expectedSorted[i]) {
      throw new Error("entryIds do not match the previewable entries");
    }
  }
}

function getQualifierSeeds(qualifiers: QualifierGroup[]): {
  firstPlace: QualifierSeed[];
  secondPlace: QualifierSeed[];
} {
  const groupNames = qualifiers.map((g) => g.groupName);
  if (new Set(groupNames).size !== groupNames.length) {
    throw new Error("Duplicate group names found in qualifiers");
  }

  return {
    firstPlace: qualifiers.map((g) => ({
      entryId: g.qualifiers[0]!.entryId,
      groupName: g.groupName,
      rank: 1,
    })),
    secondPlace: qualifiers.map((g) => ({
      entryId: g.qualifiers[1]!.entryId,
      groupName: g.groupName,
      rank: 2,
    })),
  };
}

function buildQualifierSeedEntryIds(qualifiers: QualifierGroup[]): number[] {
  if (qualifiers.length < 2) {
    throw new Error("At least two groups are required to seed knockout qualifiers");
  }

  const { firstPlace, secondPlace } = getQualifierSeeds(qualifiers);
  const bracketSize = calculateBracketSize(qualifiers.length * QUALIFIERS_PER_GROUP);
  if (bracketSize === qualifiers.length * QUALIFIERS_PER_GROUP) {
    return buildOppositeHalfQualifierSeedEntryIds(firstPlace, secondPlace);
  }

  let fallbackEntryIds: number[] | null = null;

  for (let attempt = 0; attempt < 500; attempt++) {
    const candidate = buildQualifierSeedCandidate(firstPlace, secondPlace);
    if (!candidate) continue;

    if (candidate.keepsGroupsInOppositeHalves) {
      return candidate.entryIds;
    }

    fallbackEntryIds ??= candidate.entryIds;
  }

  if (fallbackEntryIds) return fallbackEntryIds;

  throw new Error("Cannot seed qualifiers without same-group first-round rematches");
}

function buildOppositeHalfQualifierSeedEntryIds(
  firstPlace: QualifierSeed[],
  secondPlace: QualifierSeed[],
): number[] {
  const halfSize = firstPlace.length / 2;
  if (!Number.isInteger(halfSize)) {
    throw new Error("Cannot split qualifier groups evenly across bracket halves");
  }

  const shuffledFirstPlace = shuffleArray(firstPlace);
  const topHalfWinners = shuffledFirstPlace.slice(0, halfSize);
  const bottomHalfWinners = shuffledFirstPlace.slice(halfSize);
  const secondPlaceByGroup = new Map(secondPlace.map((seed) => [seed.groupName, seed]));

  const topHalfRunnerUps = shuffleArray(
    bottomHalfWinners.map((winner) => secondPlaceByGroup.get(winner.groupName)!),
  );
  const bottomHalfRunnerUps = shuffleArray(
    topHalfWinners.map((winner) => secondPlaceByGroup.get(winner.groupName)!),
  );

  return [
    ...pairWinnersWithRunnerUps(topHalfWinners, topHalfRunnerUps),
    ...pairWinnersWithRunnerUps(bottomHalfWinners, bottomHalfRunnerUps),
  ];
}

function pairWinnersWithRunnerUps(
  winners: QualifierSeed[],
  runnerUps: QualifierSeed[],
): number[] {
  return winners.flatMap((winner, index) => {
    const runnerUp = runnerUps[index]!;
    if (winner.groupName === runnerUp.groupName) {
      throw new Error("Cannot seed qualifiers without same-group first-round rematches");
    }

    return [winner.entryId, runnerUp.entryId];
  });
}

function buildQualifierSeedCandidate(
  firstPlace: QualifierSeed[],
  secondPlace: QualifierSeed[],
): QualifierSeedCandidate | null {
  const shuffledFirstPlace = shuffleArray(firstPlace);
  const availableSecondPlace = shuffleArray(secondPlace);
  const seedPairs: [QualifierSeed, QualifierSeed][] = [];

  for (const winner of shuffledFirstPlace) {
    const runnerUpIndex = availableSecondPlace.findIndex(
      (seed) => seed.groupName !== winner.groupName,
    );
    if (runnerUpIndex === -1) return null;

    const runnerUp = availableSecondPlace.splice(runnerUpIndex, 1)[0]!;
    seedPairs.push([winner, runnerUp]);
  }

  const entryIds = seedPairs.flatMap(([winner, runnerUp]) => [
    winner.entryId,
    runnerUp.entryId,
  ]);

  return {
    entryIds,
    keepsGroupsInOppositeHalves: keepsSameGroupQualifiersInOppositeHalves(
      entryIds,
      [...firstPlace, ...secondPlace],
    ),
  };
}

function keepsSameGroupQualifiersInOppositeHalves(
  entryIds: number[],
  seeds: QualifierSeed[],
): boolean {
  const bracketSize = calculateBracketSize(entryIds.length);
  const halfBoundary = bracketSize / 2;
  const seedByEntryId = new Map(seeds.map((seed) => [seed.entryId, seed]));
  const halfByGroup = new Map<string, boolean>();

  for (let slotIndex = 0; slotIndex < entryIds.length; slotIndex++) {
    const seed = seedByEntryId.get(entryIds[slotIndex]!);
    if (!seed) return false;

    const isTopHalf = slotIndex < halfBoundary;
    const existingHalf = halfByGroup.get(seed.groupName);
    if (existingHalf == null) {
      halfByGroup.set(seed.groupName, isTopHalf);
      continue;
    }

    if (existingHalf === isTopHalf) return false;
  }

  return true;
} 

function validateQualifierSeedEntryIds(
  entryIds: number[],
  qualifiers: QualifierGroup[],
): void {
  const { firstPlace, secondPlace } = getQualifierSeeds(qualifiers);
  const expectedEntryIds = [...firstPlace, ...secondPlace].map((seed) => seed.entryId);
  assertSameEntrySet(entryIds, expectedEntryIds);

  const seedByEntryId = new Map<number, QualifierSeed>();
  const allSeeds = [...firstPlace, ...secondPlace];
  for (const seed of allSeeds) {
    seedByEntryId.set(seed.entryId, seed);
  }

  for (let i = 0; i < entryIds.length; i += 2) {
    const entryASeed = seedByEntryId.get(entryIds[i]!);
    const entryBSeed = seedByEntryId.get(entryIds[i + 1]!);

    if (!entryASeed || !entryBSeed) {
      throw new Error("entryIds do not match the previewable entries");
    }
    if (entryASeed.groupName === entryBSeed.groupName) {
      throw new Error("First knockout round cannot pair qualifiers from the same group");
    }
    if (entryASeed.rank === entryBSeed.rank) {
      throw new Error("Each first-round qualifier match must pair a group winner with a runner-up");
    }
  }

  const bracketSize = calculateBracketSize(entryIds.length);
  if (
    bracketSize === entryIds.length &&
    !keepsSameGroupQualifiersInOppositeHalves(entryIds, allSeeds)
  ) {
    throw new Error("Same-group qualifiers must be seeded into opposite bracket halves");
  }
}

function calculateBracketSize(numEntries: number): number {
  for (const size of POSSIBLE_BRACKET_SIZES) {
    if (size >= numEntries) return size;
  }
  throw new Error(
    `Too many entries: ${numEntries}. Maximum supported: ${MAX_BRACKET_SIZE}`,
  );
}

function getRoundName(playersInRound: number): KnockoutRound {
  return ROUND_NAME_MAP[playersInRound] ?? "Round of 64";
}

async function getCategoryWithTournament(
  categoryId: number,
): Promise<CompetitionCategoryContext> {
  const category = await tournamentReadService.getCategoryCompetitionContext(categoryId);
  if (!category) throw new Error("Category not found");
  return category;
}

function assertOrganizer(
  userId: number,
  tournament: CompetitionTournamentContext,
): void {
  if (tournament.createdBy !== userId) {
    throw new Error("Only the tournament organizer can perform this action");
  }
}

async function assertChiefReferee(
  userId: number,
  tournamentId: number,
): Promise<void> {
  const isChief = await tournamentReadService.isTournamentReferee(
    tournamentId,
    userId,
    ["chief"],
  );
  if (!isChief) {
    throw new Error("Only the chief referee can perform this action");
  }
}

async function assertBracketsGenerated(tournament: CompetitionTournamentContext): Promise<void> {
  if (tournament.status !== "brackets_generated") {
    throw new Error("Tournament must be in brackets_generated status before managing brackets");
  }

  const config = await ScheduleConfig.findOne({ where: { tournamentId: tournament.id } });
  if (!config?.bracketGenerationDate) {
    throw new Error("Bracket generation date is not configured for this tournament");
  }

  if (new Date() < config.bracketGenerationDate) {
    throw new Error("Bracket generation date must be reached before managing brackets");
  }
}

async function attachBracketEntryNames(brackets: KnockoutBracket[]): Promise<void> {
  const entryIds = Array.from(new Set(
    brackets.flatMap((bracket) => [bracket.entryAId, bracket.entryBId])
      .filter((entryId): entryId is number => entryId != null),
  ));
  const entries = await registrationReadService.getEntryNamesByIds(entryIds);
  const entryById = new Map(entries.map((entry) => [entry.id, entry]));

  for (const bracket of brackets) {
    bracket.setDataValue(
      "entryA",
      bracket.entryAId != null ? entryById.get(bracket.entryAId) ?? null : null,
    );
    bracket.setDataValue(
      "entryB",
      bracket.entryBId != null ? entryById.get(bracket.entryBId) ?? null : null,
    );
  }
}

function formatBracketTree(
  categoryId: number,
  brackets: KnockoutBracket[],
): BracketTreeDto {
  const roundsMap = new Map<number, KnockoutBracket[]>();
  for (const b of brackets) {
    const round = roundsMap.get(b.roundNumber) ?? [];
    round.push(b);
    roundsMap.set(b.roundNumber, round);
  }

  const rounds: RoundDto[] = Array.from(roundsMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([roundNumber, roundBrackets]) => ({
      roundNumber,
      roundName: roundBrackets[0]?.roundName ?? `Round ${roundNumber}`,
      brackets: roundBrackets
        .sort((a, b) => a.bracketPosition - b.bracketPosition)
        .map(formatBracket),
    }));

  return {
    categoryId,
    totalRounds: rounds.length,
    totalBrackets: brackets.length,
    rounds,
  };
}

function formatPreviewBracketTree(
  categoryId: number,
  brackets: BracketDto[],
): BracketTreeDto {
  const roundsMap = new Map<number, BracketDto[]>();
  for (const b of brackets) {
    const round = roundsMap.get(b.roundNumber) ?? [];
    round.push(b);
    roundsMap.set(b.roundNumber, round);
  }

  const rounds: RoundDto[] = Array.from(roundsMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([roundNumber, roundBrackets]) => ({
      roundNumber,
      roundName: roundBrackets[0]?.roundName ?? `Round ${roundNumber}`,
      brackets: roundBrackets.sort(
        (a, b) => a.bracketPosition - b.bracketPosition,
      ),
    }));

  return {
    categoryId,
    totalRounds: rounds.length,
    totalBrackets: brackets.length,
    rounds,
  };
}

// ─── Core bracket builder ─────────────────────────────────────────────────────

/**
 * Tạo toàn bộ bracket tree từ danh sách slots.
 * Nhận (number | null)[] — null = TBD placeholder.
 * Xóa brackets cũ trước khi tạo mới.
 */
async function buildBracketTreeWithSlots(
  categoryId: number,
  slots: (number | null)[],
  t: Transaction,
): Promise<KnockoutBracket[]> {
  if (slots.length < MIN_ENTRIES) {
    throw new Error(
      `At least ${MIN_ENTRIES} entries are required for knockout bracket`,
    );
  }

  const bracketSize = calculateBracketSize(slots.length);

  // Pad thêm null nếu slots chưa đủ bracketSize
  const paddedSlots: (number | null)[] = [
    ...slots,
    ...Array(bracketSize - slots.length).fill(null),
  ];

  const totalRounds = Math.log2(bracketSize);

  await KnockoutBracket.destroy({ where: { categoryId }, transaction: t });

  const allBrackets: KnockoutBracket[] = [];

  // ── Round 1 ────────────────────────────────────────────────────────────────
  const round1Brackets: KnockoutBracket[] = [];
  const numRound1 = bracketSize / 2;

  for (let i = 0; i < numRound1; i++) {
    const entryAId = paddedSlots[i * 2] ?? undefined;
    const entryBId = paddedSlots[i * 2 + 1] ?? undefined;

    const isByeMatch = (entryAId == null) !== (entryBId == null);
    const isTBDMatch = entryAId == null && entryBId == null;

    const winnerEntryId = isByeMatch ? (entryAId ?? entryBId) : undefined;

    const status: BracketStatus = isByeMatch
      ? "completed"
      : isTBDMatch
        ? "pending"
        : entryAId && entryBId
          ? "ready"
          : "pending";

    const bracket = await KnockoutBracket.create(
      {
        categoryId,
        roundNumber: 1,
        bracketPosition: i,
        entryAId,
        entryBId,
        winnerEntryId,
        status,
        roundName: getRoundName(bracketSize),
        isByeMatch,
      },
      { transaction: t },
    );

    round1Brackets.push(bracket);
    allBrackets.push(bracket);
  }

  // ── Rounds 2..N ───────────────────────────────────────────────────────────
  let prevRound = round1Brackets;

  for (let round = 2; round <= totalRounds; round++) {
    const numBrackets = prevRound.length / 2;
    const playersInRound = bracketSize / Math.pow(2, round - 1);
    const currentRound: KnockoutBracket[] = [];

    for (let i = 0; i < numBrackets; i++) {
      const prevA = prevRound[i * 2]!;
      const prevB = prevRound[i * 2 + 1]!;

      const entryAId =
        prevA.status === "completed" ? prevA.winnerEntryId : undefined;
      const entryBId =
        prevB.status === "completed" ? prevB.winnerEntryId : undefined;

      const status: BracketStatus = entryAId && entryBId ? "ready" : "pending";

      const bracket = await KnockoutBracket.create(
        {
          categoryId,
          roundNumber: round,
          bracketPosition: i,
          previousBracketAId: prevA.id,
          previousBracketBId: prevB.id,
          entryAId,
          entryBId,
          status,
          roundName: getRoundName(playersInRound),
          isByeMatch: false,
        },
        { transaction: t },
      );

      await prevA.update({ nextBracketId: bracket.id }, { transaction: t });
      await prevB.update({ nextBracketId: bracket.id }, { transaction: t });

      currentRound.push(bracket);
      allBrackets.push(bracket);
    }

    prevRound = currentRound;
  }

  return allBrackets;
}

function buildPreviewBracketTreeWithSlots(
  categoryId: number,
  slots: (number | null)[],
  entryNames = new Map<number, string>(),
): BracketTreeDto {
  if (slots.length < MIN_ENTRIES) {
    throw new Error(
      `At least ${MIN_ENTRIES} entries are required for knockout bracket`,
    );
  }

  const bracketSize = calculateBracketSize(slots.length);
  const paddedSlots: (number | null)[] = [
    ...slots,
    ...Array(bracketSize - slots.length).fill(null),
  ];
  const totalRounds = Math.log2(bracketSize);
  const allBrackets: BracketDto[] = [];
  const round1Brackets: BracketDto[] = [];
  const numRound1 = bracketSize / 2;
  let nextId = -1;

  for (let i = 0; i < numRound1; i++) {
    const entryAId = paddedSlots[i * 2] ?? null;
    const entryBId = paddedSlots[i * 2 + 1] ?? null;
    const isByeMatch = (entryAId == null) !== (entryBId == null);
    const isTBDMatch = entryAId == null && entryBId == null;
    const winnerEntryId = isByeMatch ? (entryAId ?? entryBId) : null;
    const status: BracketStatus = isByeMatch
      ? "completed"
      : isTBDMatch
        ? "pending"
        : "ready";

    const bracket: BracketDto = {
      id: nextId--,
      roundNumber: 1,
      roundName: getRoundName(bracketSize),
      bracketPosition: i,
      entryA: formatSlot(entryAId, entryAId ? entryNames.get(entryAId) : null),
      entryB: formatSlot(entryBId, entryBId ? entryNames.get(entryBId) : null),
      winnerEntryId,
      status,
      isByeMatch,
      previousBracketAId: null,
      previousBracketBId: null,
      nextBracketId: null,
    };

    round1Brackets.push(bracket);
    allBrackets.push(bracket);
  }

  let prevRound = round1Brackets;

  for (let round = 2; round <= totalRounds; round++) {
    const numBrackets = prevRound.length / 2;
    const playersInRound = bracketSize / Math.pow(2, round - 1);
    const currentRound: BracketDto[] = [];

    for (let i = 0; i < numBrackets; i++) {
      const prevA = prevRound[i * 2]!;
      const prevB = prevRound[i * 2 + 1]!;
      const entryAId =
        prevA.status === "completed" ? prevA.winnerEntryId : null;
      const entryBId =
        prevB.status === "completed" ? prevB.winnerEntryId : null;
      const status: BracketStatus = entryAId && entryBId ? "ready" : "pending";

      const bracket: BracketDto = {
        id: nextId--,
        roundNumber: round,
        roundName: getRoundName(playersInRound),
        bracketPosition: i,
        entryA: formatSlot(entryAId, entryAId ? entryNames.get(entryAId) : null),
        entryB: formatSlot(entryBId, entryBId ? entryNames.get(entryBId) : null),
        winnerEntryId: null,
        status,
        isByeMatch: false,
        previousBracketAId: prevA.id,
        previousBracketBId: prevB.id,
        nextBracketId: null,
      };

      prevA.nextBracketId = bracket.id;
      prevB.nextBracketId = bracket.id;
      currentRound.push(bracket);
      allBrackets.push(bracket);
    }

    prevRound = currentRound;
  }

  return formatPreviewBracketTree(categoryId, allBrackets);
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class KnockoutBracketService {
  // ── 1. Generate placeholders (có vòng bảng) ───────────────────────────────

  /**
   * Tạo bracket placeholders dựa trên số bảng đấu hiện có.
   * Tất cả slots đều là TBD — dùng để tạo schedule trước khi vòng bảng kết thúc.
   * Fill entryId thật sau khi vòng bảng kết thúc qua fillQualifiers().
   */
  async previewPlaceholders(
    organizerId: number,
    categoryId: number,
  ): Promise<BracketTreeDto> {
    const category = await getCategoryWithTournament(categoryId);
    assertOrganizer(organizerId, category.tournament);
    await assertBracketsGenerated(category.tournament);

    const groupNames = await GroupStanding.findAll({
      where: { categoryId },
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("groupName")), "groupName"],
      ],
    });

    if (groupNames.length === 0) {
      throw new Error("No groups found. Save group assignments first.");
    }

    const numSlots = groupNames.length * QUALIFIERS_PER_GROUP;
    const slots: (number | null)[] = Array(numSlots).fill(null);

    return buildPreviewBracketTreeWithSlots(categoryId, slots);
  }

  async generatePlaceholders(
    chiefRefereeId: number,
    categoryId: number,
  ): Promise<BracketTreeDto> {
    const category = await getCategoryWithTournament(categoryId);
    assertOrganizer(chiefRefereeId, category.tournament);
    await assertBracketsGenerated(category.tournament);

    // Đếm số bảng hiện có để tính số slots = numGroups * QUALIFIERS_PER_GROUP
    const groupNames = await GroupStanding.findAll({
      where: { categoryId },
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("groupName")), "groupName"],
      ],
    });

    if (groupNames.length === 0) {
      throw new Error("No groups found. Save group assignments first.");
    }

    const numSlots = groupNames.length * QUALIFIERS_PER_GROUP;
    const slots: (number | null)[] = Array(numSlots).fill(null); // tất cả TBD

    await sequelize.transaction((t) =>
      buildBracketTreeWithSlots(categoryId, slots, t),
    );

    const bracketsWithEntries = await KnockoutBracket.findAll({
      where: { categoryId },
      order: [
        ["roundNumber", "ASC"],
        ["bracketPosition", "ASC"],
      ],
    });
    await attachBracketEntryNames(bracketsWithEntries);

    return formatBracketTree(categoryId, bracketsWithEntries);
  }

  // ── 2. Fill qualifiers vào placeholders ───────────────────────────────────

  /**
   * Fill entryId thật vào bracket round 1 sau khi vòng bảng kết thúc.
   * Gọi sau generatePlaceholders() khi đã có kết quả đầy đủ.
   * Mỗi trận vòng đầu là nhất bảng này gặp nhì bảng khác.
   */
  async previewFillQualifiers(
    organizerId: number,
    categoryId: number,
  ): Promise<BracketPreviewResponse> {
    const category = await getCategoryWithTournament(categoryId);
    assertOrganizer(organizerId, category.tournament);

    const qualifiersResult =
      await groupStandingService.getQualifiers(categoryId);
    const qualifiers = Array.isArray(qualifiersResult)
      ? qualifiersResult
      : qualifiersResult.qualifiers || [];

    if (qualifiers.length === 0) {
      throw new Error("No qualifiers found.");
    }

    const incomplete = qualifiers.filter(
      (g) => g.qualifiers.length < QUALIFIERS_PER_GROUP,
    );
    if (incomplete.length > 0) {
      throw new Error(
        `Groups not fully ranked yet: ${incomplete.map((g) => g.groupName).join(", ")}`,
      );
    }

    const round1Brackets = await KnockoutBracket.findAll({
      where: { categoryId, roundNumber: 1 },
      order: [["bracketPosition", "ASC"]],
    });

    if (round1Brackets.length === 0) {
      throw new Error(
        "No placeholder brackets found. Run generatePlaceholders() first.",
      );
    }

    const entryIds = buildQualifierSeedEntryIds(qualifiers);

    const entries = await registrationReadService.getEntryNamesByIds(entryIds);
    const entryNames = new Map(entries.map((e) => [e.id, e.name]));

    return {
      entryIds,
      bracketTree: buildPreviewBracketTreeWithSlots(categoryId, entryIds, entryNames),
    };
  }

  async fillQualifiers(
    chiefRefereeId: number,
    categoryId: number,
    previewEntryIds: number[],
  ): Promise<BracketTreeDto> {
    const category = await getCategoryWithTournament(categoryId);
    assertOrganizer(chiefRefereeId, category.tournament);

    const qualifiersResult =
      await groupStandingService.getQualifiers(categoryId);
    const qualifiers = Array.isArray(qualifiersResult)
      ? qualifiersResult
      : qualifiersResult.qualifiers || [];

    if (qualifiers.length === 0) {
      throw new Error("No qualifiers found.");
    }

    // Kiểm tra tất cả bảng đã có đủ nhất + nhì chưa
    const incomplete = qualifiers.filter(
      (g) => g.qualifiers.length < QUALIFIERS_PER_GROUP,
    );
    if (incomplete.length > 0) {
      throw new Error(
        `Groups not fully ranked yet: ${incomplete.map((g) => g.groupName).join(", ")}`,
      );
    }

    // Lấy round 1 brackets hiện tại (đang là TBD)
    const round1Brackets = await KnockoutBracket.findAll({
      where: { categoryId, roundNumber: 1 },
      order: [["bracketPosition", "ASC"]],
    });

    if (round1Brackets.length === 0) {
      throw new Error(
        "No placeholder brackets found. Run generatePlaceholders() first.",
      );
    }

    const entryIds = previewEntryIds;
    validateQualifierSeedEntryIds(entryIds, qualifiers);

    await sequelize.transaction(async (t) => {
      for (let i = 0; i < round1Brackets.length; i++) {
        const bracket = round1Brackets[i]!;
        const entryAId = entryIds[i * 2] ?? undefined;
        const entryBId = entryIds[i * 2 + 1] ?? undefined;

        const isByeMatch = (entryAId == null) !== (entryBId == null);
        const winnerEntryId = isByeMatch ? (entryAId ?? entryBId) : undefined;
        const status: BracketStatus = isByeMatch
          ? "completed"
          : entryAId && entryBId
            ? "ready"
            : "pending";

        await bracket.update(
          { entryAId, entryBId, winnerEntryId, status, isByeMatch },
          { transaction: t },
        );

        // Nếu bye → fill luôn vào bracket vòng sau
        if (isByeMatch && bracket.nextBracketId && winnerEntryId) {
          const next = await KnockoutBracket.findByPk(bracket.nextBracketId, {
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
          if (next) {
            const isSlotA = next.previousBracketAId === bracket.id;
            const updateData = isSlotA
              ? { entryAId: winnerEntryId }
              : { entryBId: winnerEntryId };
            const willHaveBoth = isSlotA
              ? next.entryBId != null
              : next.entryAId != null;
            await next.update(
              { ...updateData, status: willHaveBoth ? "ready" : "pending" },
              { transaction: t },
            );
          }
        }
      }
    });

    const bracketsWithEntries = await KnockoutBracket.findAll({
      where: { categoryId },
      order: [
        ["roundNumber", "ASC"],
        ["bracketPosition", "ASC"],
      ],
    });
    await attachBracketEntryNames(bracketsWithEntries);

    return formatBracketTree(categoryId, bracketsWithEntries);
  }

  // ── 3. Generate từ danh sách entry (không có vòng bảng) ──────────────────

  /**
   * Generate knockout bracket từ danh sách entry đủ điều kiện.
   * Dùng cho giải đấu không có vòng bảng.
   */
  async previewFromEntries(
    organizerId: number,
    categoryId: number,
  ): Promise<BracketPreviewResponse> {
    const category = await getCategoryWithTournament(categoryId);
    assertOrganizer(organizerId, category.tournament);
    await assertBracketsGenerated(category.tournament);

    if (category.isGroupStage) {
      throw new Error(
        "This category has a group stage. Use generatePlaceholders + fillQualifiers instead.",
      );
    }

    const eligible = await registrationReadService.getEligibleEntriesByCategory({
      categoryId,
      categoryType: category.type,
      requireConfirmed: true,
    });

    if (eligible.length < MIN_ENTRIES) {
      throw new Error(
        `Not enough eligible entries (${eligible.length}). Minimum: ${MIN_ENTRIES}.`,
      );
    }

    const entryIds = shuffleArray(eligible.map((e) => e.id));
    const entryNames = new Map(eligible.map((e) => [e.id, e.name]));

    return {
      entryIds,
      bracketTree: buildPreviewBracketTreeWithSlots(categoryId, entryIds, entryNames),
    };
  }

  async generateFromEntries(
    chiefRefereeId: number,
    categoryId: number,
    previewEntryIds: number[],
  ): Promise<BracketTreeDto> {
    const category = await getCategoryWithTournament(categoryId);
    assertOrganizer(chiefRefereeId, category.tournament);
    await assertBracketsGenerated(category.tournament);

    if (category.isGroupStage) {
      throw new Error(
        "This category has a group stage. Use generatePlaceholders + fillQualifiers instead.",
      );
    }

    const eligible = await registrationReadService.getEligibleEntriesByCategory({
      categoryId,
      categoryType: category.type,
      requireConfirmed: true,
    });

    if (eligible.length < MIN_ENTRIES) {
      throw new Error(
        `Not enough eligible entries (${eligible.length}). Minimum: ${MIN_ENTRIES}.`,
      );
    }

    const defaultEntryIds = eligible.map((e) => e.id);
    const entryIds = previewEntryIds;
    assertSameEntrySet(entryIds, defaultEntryIds);

    await sequelize.transaction((t) =>
      buildBracketTreeWithSlots(categoryId, entryIds, t),
    );

    const bracketsWithEntries = await KnockoutBracket.findAll({
      where: { categoryId },
      order: [
        ["roundNumber", "ASC"],
        ["bracketPosition", "ASC"],
      ],
    });
    await attachBracketEntryNames(bracketsWithEntries);

    return formatBracketTree(categoryId, bracketsWithEntries);
  }

  async saveAssignments(
    chiefRefereeId: number,
    categoryId: number,
    previewEntryIds?: number[],
  ): Promise<BracketTreeDto> {
    const category = await getCategoryWithTournament(categoryId);

    if (category.isGroupStage) {
      if (previewEntryIds == null) {
        return this.generatePlaceholders(chiefRefereeId, categoryId);
      }

      return this.fillQualifiers(chiefRefereeId, categoryId, previewEntryIds);
    }

    if (previewEntryIds == null) {
      throw new Error("entryIds must be an array of positive integers");
    }

    return this.generateFromEntries(chiefRefereeId, categoryId, previewEntryIds);
  }

  // ── 4. Cập nhật kết quả trận đấu ─────────────────────────────────────────

  /**
   * Cập nhật đội thắng vào bracket và điền vào bracket tiếp theo.
   * Nếu bracket tiếp theo chưa có đối thủ → status = pending cho đến khi đủ cả 2.
   */
  async advanceWinner(
    chiefRefereeId: number,
    bracketId: number,
    winnerEntryId: number,
  ): Promise<KnockoutBracket> {
    const bracket = await KnockoutBracket.findByPk(bracketId);
    if (!bracket) throw new Error("Bracket not found");

    const category = await getCategoryWithTournament(bracket.categoryId);
    await assertChiefReferee(chiefRefereeId, category.tournamentId);

    if (bracket.status === "completed") {
      throw new Error("This bracket has already been completed");
    }
    if (bracket.status !== "ready" && bracket.status !== "in_progress") {
      throw new Error("Bracket is not ready to accept a result");
    }
    if (
      !bracket.isByeMatch &&
      winnerEntryId !== bracket.entryAId &&
      winnerEntryId !== bracket.entryBId
    ) {
      throw new Error("Winner must be either Entry A or Entry B");
    }

    return await sequelize.transaction(async (t: Transaction) => {
      await bracket.update(
        { winnerEntryId, status: "completed" },
        { transaction: t },
      );

      if (bracket.nextBracketId) {
        const next = await KnockoutBracket.findByPk(bracket.nextBracketId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!next) return bracket;

        const isSlotA = next.previousBracketAId === bracketId;
        const updateData: Partial<{
          entryAId: number;
          entryBId: number;
          status: BracketStatus;
        }> = isSlotA
          ? { entryAId: winnerEntryId }
          : { entryBId: winnerEntryId };

        const willHaveBoth = isSlotA
          ? next.entryBId != null
          : next.entryAId != null;

        updateData.status = willHaveBoth ? "ready" : "pending";

        await next.update(updateData, { transaction: t });
      }

      return bracket.reload({ transaction: t });
    });
  }

  // ── 5. Get bracket theo entryId hoặc entryName ────────────────────────────

  /**
   * Lấy tất cả brackets liên quan đến 1 entry (theo id hoặc tên entry).
   */
  async getBracketsByEntry(
    categoryId: number,
    filter: { entryId?: number; entryName?: string },
    options?: { offset?: number; limit?: number },
  ): Promise<{ brackets?: BracketDto[]; pagination?: any } | BracketDto[]> {
    if (!filter.entryId && !filter.entryName) {
      throw new Error("Provide either entryId or entryName");
    }

    let targetEntryId = filter.entryId;

    if (!targetEntryId && filter.entryName) {
      const trimmed = filter.entryName.trim();
      const entry = await registrationReadService.getEntryByNameInCategory(
        categoryId,
        trimmed,
      );
      if (!entry) throw new Error("Entry not found for the given name");
      targetEntryId = entry.id;
    }

    const where = {
      categoryId,
      [Op.or]: [
        { entryAId: targetEntryId },
        { entryBId: targetEntryId },
        { winnerEntryId: targetEntryId },
      ],
    };

    const order: any = [
      ["roundNumber", "ASC"],
      ["bracketPosition", "ASC"],
    ];

    if (
      options &&
      (options.offset !== undefined || options.limit !== undefined)
    ) {
      const offset = options.offset ?? 0;
      const limit = options.limit ?? 10;

      const { count, rows } = await KnockoutBracket.findAndCountAll({
        where,
        order,
        offset,
        limit,
      });
      await attachBracketEntryNames(rows);

      const totalPages = Math.ceil(count / limit);
      const page = Math.floor(offset / limit) + 1;

      return {
        brackets: rows.map(formatBracket),
        pagination: {
          total: count,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    }

    const brackets = await KnockoutBracket.findAll({
      where,
      order,
    });
    await attachBracketEntryNames(brackets);

    return brackets.map(formatBracket);
  }

  // ── 6. Get toàn bộ bracket tree ───────────────────────────────────────────

  /**
   * Lấy toàn bộ bracket tree của 1 category.
   */
  async getBracketTree(categoryId: number): Promise<BracketTreeDto> {
    const brackets = await KnockoutBracket.findAll({
      where: { categoryId },
      order: [
        ["roundNumber", "ASC"],
        ["bracketPosition", "ASC"],
      ],
    });
    await attachBracketEntryNames(brackets);

    if (brackets.length === 0)
      throw new Error("No bracket found for this category");

    return formatBracketTree(categoryId, brackets);
  }

  // ── 7. Validate bracket integrity ─────────────────────────────────────────

  /**
   * Kiểm tra bracket tree có hợp lệ trước khi bắt đầu giải:
   * - Tất cả bracket round 1 đã có đủ entries hoặc là bye (không còn TBD)
   * - Không có entry nào xuất hiện 2 lần
   * - Bracket tree liên kết đúng (nextBracketId / previousBracketId)
   * - Số lượng brackets đúng với bracket size
   */
  async validateBracketIntegrity(
    chiefRefereeId: number,
    categoryId: number,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const category = await getCategoryWithTournament(categoryId);
    assertOrganizer(chiefRefereeId, category.tournament);

    const brackets = await KnockoutBracket.findAll({
      where: { categoryId },
      order: [
        ["roundNumber", "ASC"],
        ["bracketPosition", "ASC"],
      ],
    });

    if (brackets.length === 0) {
      return { valid: false, errors: ["No brackets found for this category"] };
    }

    const errors: string[] = [];

    // ── Check 1: Số lượng brackets đúng ───────────────────────────────────
    const totalRounds = Math.max(...brackets.map((b) => b.roundNumber));
    const bracketSize = Math.pow(2, totalRounds);
    const expectedTotal = bracketSize - 1;

    if (brackets.length !== expectedTotal) {
      errors.push(
        `Expected ${expectedTotal} brackets for bracket size ${bracketSize}, found ${brackets.length}`,
      );
    }

    // ── Check 2: Round 1 không còn TBD (fillQualifiers phải đã chạy) ──────
    // isByeMatch được bỏ qua vì bye là trạng thái hợp lệ
    const round1 = brackets.filter((b) => b.roundNumber === 1);
    for (const b of round1) {
      if (!b.entryAId && !b.entryBId && !b.isByeMatch) {
        errors.push(
          `Bracket [round=1, position=${b.bracketPosition}] still has TBD entries. Run fillQualifiers() first.`,
        );
      }
    }

    // ── Check 3: Không có entry trùng lặp ─────────────────────────────────
    const allEntryIds: number[] = [];
    for (const b of round1) {
      if (b.entryAId) allEntryIds.push(b.entryAId);
      if (b.entryBId) allEntryIds.push(b.entryBId);
    }

    const seen = new Set<number>();
    const duplicates = new Set<number>();
    for (const id of allEntryIds) {
      if (seen.has(id)) duplicates.add(id);
      seen.add(id);
    }
    if (duplicates.size > 0) {
      errors.push(`Duplicate entries found: [${[...duplicates].join(", ")}]`);
    }

    // ── Check 4: Mỗi bracket có nextBracketId đúng (trừ Final) ────────────
    const bracketMap = new Map(brackets.map((b) => [b.id, b]));

    for (const b of brackets) {
      if (b.roundNumber === totalRounds) {
        if (b.nextBracketId) {
          errors.push(
            `Final bracket [id=${b.id}] should not have a nextBracketId`,
          );
        }
        continue;
      }

      if (!b.nextBracketId) {
        errors.push(
          `Bracket [id=${b.id}, round=${b.roundNumber}] is missing nextBracketId`,
        );
        continue;
      }

      const next = bracketMap.get(b.nextBracketId);
      if (!next) {
        errors.push(
          `Bracket [id=${b.id}] references non-existent nextBracketId=${b.nextBracketId}`,
        );
        continue;
      }

      if (next.roundNumber !== b.roundNumber + 1) {
        errors.push(
          `Bracket [id=${b.id}] nextBracket should be round ${b.roundNumber + 1}, found ${next.roundNumber}`,
        );
      }
    }

    // ── Check 5: previousBracketAId / previousBracketBId đúng ─────────────
    for (const b of brackets) {
      if (b.roundNumber === 1) continue;

      if (!b.previousBracketAId || !b.previousBracketBId) {
        errors.push(
          `Bracket [id=${b.id}, round=${b.roundNumber}] is missing previousBracketAId or previousBracketBId`,
        );
        continue;
      }

      const prevA = bracketMap.get(b.previousBracketAId);
      const prevB = bracketMap.get(b.previousBracketBId);

      if (!prevA) {
        errors.push(
          `Bracket [id=${b.id}] references non-existent previousBracketAId=${b.previousBracketAId}`,
        );
      }
      if (!prevB) {
        errors.push(
          `Bracket [id=${b.id}] references non-existent previousBracketBId=${b.previousBracketBId}`,
        );
      }
      if (prevA && prevA.nextBracketId !== b.id) {
        errors.push(
          `Bracket [id=${b.previousBracketAId}] nextBracketId should point to [id=${b.id}]`,
        );
      }
      if (prevB && prevB.nextBracketId !== b.id) {
        errors.push(
          `Bracket [id=${b.previousBracketBId}] nextBracketId should point to [id=${b.id}]`,
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // ── 8. Get standings ───────────────────────────────────────────────────────

  /**
   * Lấy kết quả xếp hạng cuối giải knockout:
   * - Vô địch: winner của Final
   * - Á quân: loser của Final
   * - Hạng 3: loser của 2 Semi-final (đồng hạng 3)
   * - Eliminated: danh sách bị loại theo từng vòng
   */
  async getStandings(categoryId: number): Promise<{
    champion?: number;
    runnerUp?: number;
    thirdPlace?: number[];
    eliminated: { entryId: number; eliminatedAt: string }[];
  }> {
    const brackets = await KnockoutBracket.findAll({
      where: { categoryId },
      order: [["roundNumber", "DESC"]],
    });

    if (brackets.length === 0) throw new Error("No brackets found");

    const totalRounds = Math.max(...brackets.map((b) => b.roundNumber));

    // ── Vô địch & Á quân từ Final ──────────────────────────────────────────
    const final = brackets.find(
      (b) => b.roundNumber === totalRounds && b.bracketPosition === 0,
    );

    if (!final || final.status !== "completed") {
      throw new Error("Tournament is not completed yet");
    }

    const champion = final.winnerEntryId;
    const runnerUp =
      champion === final.entryAId ? final.entryBId : final.entryAId;

    // ── Đồng hạng 3: cả 2 loser của Semi-final ────────────────────────────
    const semiFinals = brackets.filter(
      (b) => b.roundNumber === totalRounds - 1,
    );

    const thirdPlace: number[] = semiFinals
      .filter((b) => b.status === "completed" && b.winnerEntryId)
      .map((b) => (b.winnerEntryId === b.entryAId ? b.entryBId : b.entryAId))
      .filter((id): id is number => id != null);

    // ── Danh sách bị loại theo từng vòng ──────────────────────────────────
    const eliminated: { entryId: number; eliminatedAt: string }[] = [];

    for (const b of brackets) {
      if (b.status !== "completed" || !b.winnerEntryId || b.isByeMatch)
        continue;
      if (b.roundNumber >= totalRounds - 1) continue; // bỏ qua Final và Semi

      const loserId =
        b.winnerEntryId === b.entryAId ? b.entryBId : b.entryAId;

      if (loserId) {
        eliminated.push({ entryId: loserId, eliminatedAt: b.roundName });
      }
    }

    const standings: {
      champion?: number;
      runnerUp?: number;
      thirdPlace?: number[];
      eliminated: { entryId: number; eliminatedAt: string }[];
    } = { eliminated };

    if (champion != null) standings.champion = champion;
    if (runnerUp != null) standings.runnerUp = runnerUp;
    if (thirdPlace.length > 0) standings.thirdPlace = thirdPlace;

    return standings;
  }
}

export default new KnockoutBracketService();
