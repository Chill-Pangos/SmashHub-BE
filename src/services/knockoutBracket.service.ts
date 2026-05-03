// knockoutBracket.service.ts
import { Op, Transaction } from "sequelize";
import { sequelize } from "../config/database";
import KnockoutBracket, {
  BracketStatus,
} from "../models/knockoutBracket.model";
import TournamentCategory from "../models/tournamentCategory.model";
import Tournament from "../models/tournament.model";
import TournamentReferee from "../models/tournamentReferee.model";
import Entry from "../models/entry.model";
import User from "../models/user.model";
import groupStandingService from "./groupStanding.service";
import entryService from "./entry.service";
import { KnockoutRound, KNOCKOUT_ROUNDS } from "../models/schedule.model";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BracketSlot {
  entryId: number | null; // null = bye
}

interface RoundDto {
  roundNumber: number;
  roundName: string;
  brackets: KnockoutBracket[];
}

interface BracketTreeDto {
  categoryId: number;
  totalRounds: number;
  totalBrackets: number;
  rounds: RoundDto[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_ENTRIES = 4;
const MAX_BRACKET_SIZE = 256;
const POSSIBLE_BRACKET_SIZES = [4, 8, 16, 32, 64, 128, 256];

// roundNumber → roundName mapping (dựa trên bracket size)
const ROUND_NAME_MAP: Record<number, KnockoutRound> = {
  2: "Final",
  4: "Semi-final",
  8: "Quarter-final",
  16: "Round of 16",
  32: "Round of 32",
  64: "Round of 64",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
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
): Promise<TournamentCategory> {
  const category = await TournamentCategory.findByPk(categoryId, {
    include: [{ model: Tournament }],
  });
  if (!category) throw new Error("Category not found");
  return category;
}

async function assertChiefReferee(
  userId: number,
  tournamentId: number,
): Promise<void> {
  const ref = await TournamentReferee.findOne({
    where: { refereeId: userId, tournamentId, role: "chief" },
  });
  if (!ref) throw new Error("Only the chief referee can perform this action");
}

/**
 * Tạo danh sách slots từ entries + bye slots.
 * Bye slots được phân bổ đều ở 2 nửa bracket.
 */
function buildSlots(entryIds: number[], bracketSize: number): BracketSlot[] {
  const numByes = bracketSize - entryIds.length;
  const shuffled = shuffleArray(entryIds);

  // Xen kẽ bye vào giữa các entries để phân bổ đều
  const slots: BracketSlot[] = shuffled.map((id) => ({ entryId: id }));
  const byeSlots: BracketSlot[] = Array(numByes).fill({ entryId: null });

  // Phân bổ bye đều vào 2 nửa
  const topEntries = slots.slice(0, Math.ceil(shuffled.length / 2));
  const bottomEntries = slots.slice(Math.ceil(shuffled.length / 2));
  const topByes = byeSlots.slice(0, Math.ceil(numByes / 2));
  const bottomByes = byeSlots.slice(Math.ceil(numByes / 2));

  const topHalf = shuffleArray([...topEntries, ...topByes]);
  const bottomHalf = shuffleArray([...bottomEntries, ...bottomByes]);

  return [...topHalf, ...bottomHalf];
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
 * Xóa brackets cũ trước khi tạo mới.
 */
async function buildBracketTree(
  categoryId: number,
  entryIds: number[],
  t: Transaction,
): Promise<KnockoutBracket[]> {
  if (entryIds.length < MIN_ENTRIES) {
    throw new Error(
      `At least ${MIN_ENTRIES} entries are required for knockout bracket`,
    );
  }

  const bracketSize = calculateBracketSize(entryIds.length);
  const slots = buildSlots(entryIds, bracketSize);
  const totalRounds = Math.log2(bracketSize);

  // Xóa brackets cũ
  await KnockoutBracket.destroy({ where: { categoryId }, transaction: t });

  const allBrackets: KnockoutBracket[] = [];

  // ── Round 1 ────────────────────────────────────────────────────────────────
  const round1Brackets: KnockoutBracket[] = [];
  const numRound1 = bracketSize / 2;
  const playersInRound1 = bracketSize;

  for (let i = 0; i < numRound1; i++) {
    const slotA = slots[i * 2]!;
    const slotB = slots[i * 2 + 1]!;

    const isByeMatch = !slotA.entryId || !slotB.entryId;
    const winnerEntryId = isByeMatch
      ? (slotA.entryId ?? slotB.entryId ?? undefined)
      : undefined;
    const status: BracketStatus = isByeMatch
      ? "completed"
      : slotA.entryId && slotB.entryId
        ? "ready"
        : "pending";

    const bracket = await KnockoutBracket.create(
      {
        categoryId,
        roundNumber: 1,
        bracketPosition: i,
        entryAId: slotA.entryId ?? undefined,
        entryBId: slotB.entryId ?? undefined,
        winnerEntryId,
        status,
        roundName: getRoundName(playersInRound1),
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

      // Nếu cả 2 bracket cha đều là bye → fill winner ngay
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

      // Cập nhật nextBracketId cho 2 bracket cha
      await prevA.update({ nextBracketId: bracket.id }, { transaction: t });
      await prevB.update({ nextBracketId: bracket.id }, { transaction: t });

      currentRound.push(bracket);
      allBrackets.push(bracket);
    }

    prevRound = currentRound;
  }

  return allBrackets;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class KnockoutBracketService {
  // ── 1. Generate từ kết quả vòng bảng ─────────────────────────────────────

  /**
   * Generate knockout bracket từ danh sách đội vào vòng trong (có vòng bảng).
   * Đội nhất và đội nhì được xếp khác nhánh để tránh gặp nhau sớm.
   */
  async generateFromGroupStage(
    chiefRefereeId: number,
    categoryId: number,
    qualifiersPerGroup = 2,
  ): Promise<BracketTreeDto> {
    const category = await getCategoryWithTournament(categoryId);
    await assertChiefReferee(chiefRefereeId, category.tournamentId);

    const qualifiersResult = await groupStandingService.getQualifiers(
      categoryId,
      qualifiersPerGroup,
    );

    // Handle union return type: could be array or object with pagination
    const qualifiers = Array.isArray(qualifiersResult)
      ? qualifiersResult
      : qualifiersResult.qualifiers || [];

    if (qualifiers.length === 0) {
      throw new Error("No qualifiers found. Run getQualifiers first.");
    }

    // Tách đội nhất và đội nhì để xếp khác nhánh
    const firstPlace = qualifiers
      .map((g) => g.qualifiers[0])
      .filter((s): s is NonNullable<typeof s> => s != null)
      .map((s) => s.entryId);

    const secondPlace = qualifiers
      .map((g) => g.qualifiers[1])
      .filter((s): s is NonNullable<typeof s> => s != null)
      .map((s) => s.entryId);

    // Shuffle mỗi nhóm riêng
    const shuffledFirst = shuffleArray(firstPlace);
    const shuffledSecond = shuffleArray(secondPlace);

    // Xen kẽ đội nhất và đội nhì vào 2 nửa bracket khác nhau
    // Nửa trên: đội nhất bảng A, B, C... (index chẵn)
    // Nửa dưới: đội nhì bảng A, B, C... (đối diện với đội nhất)
    const topHalf = shuffleArray([
      ...shuffledFirst.filter((_, i) => i % 2 === 0),
      ...shuffledSecond.filter((_, i) => i % 2 !== 0),
    ]);
    const bottomHalf = shuffleArray([
      ...shuffledFirst.filter((_, i) => i % 2 !== 0),
      ...shuffledSecond.filter((_, i) => i % 2 === 0),
    ]);

    const entryIds = [...topHalf, ...bottomHalf];

    const brackets = await sequelize.transaction((t) =>
      buildBracketTree(categoryId, entryIds, t),
    );

    return formatBracketTree(categoryId, brackets);
  }

  // ── 2. Generate từ danh sách entry (không có vòng bảng) ──────────────────

  /**
   * Generate knockout bracket từ danh sách entry đủ điều kiện.
   * Dùng cho giải đấu không có vòng bảng.
   */
  async generateFromEntries(
    chiefRefereeId: number,
    categoryId: number,
  ): Promise<BracketTreeDto> {
    const category = await getCategoryWithTournament(categoryId);
    await assertChiefReferee(chiefRefereeId, category.tournamentId);

    if (category.isGroupStage) {
      throw new Error(
        "This category has a group stage. Use generateFromGroupStage instead.",
      );
    }

    const result = await entryService.getEligibleEntries(categoryId);
    const eligible = Array.isArray(result) ? [] : (result.eligible ?? []);

    if (eligible.length < MIN_ENTRIES) {
      throw new Error(
        `Not enough eligible entries (${eligible.length}). Minimum: ${MIN_ENTRIES}.`,
      );
    }

    const entryIds = eligible.map((e) => e.id);

    const brackets = await sequelize.transaction((t) =>
      buildBracketTree(categoryId, entryIds, t),
    );

    return formatBracketTree(categoryId, brackets);
  }

  // ── 3. Cập nhật kết quả trận đấu ─────────────────────────────────────────

  /**
   * Cập nhật đội thắng vào bracket và điền vào bracket tiếp theo.
   * Nếu bracket tiếp theo chưa có đối thủ → placeholder (entryId set, status = pending).
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
      // Cập nhật bracket hiện tại
      await bracket.update(
        { winnerEntryId, status: "completed" },
        { transaction: t },
      );

      // Điền vào bracket tiếp theo nếu có
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

        // Kiểm tra nếu cả 2 slot đã có → ready
        const willHaveBoth = isSlotA
          ? next.entryBId != null
          : next.entryAId != null;

        updateData.status = willHaveBoth ? "ready" : "pending";

        await next.update(updateData, { transaction: t });
      }

      return bracket.reload({ transaction: t });
    });
  }

  // ── 4. Get bracket theo entryId hoặc entryName ────────────────────────────

  /**
   * Lấy tất cả brackets liên quan đến 1 entry (theo id hoặc tên entry).
   */
  async getBracketsByEntry(
    categoryId: number,
    filter: { entryId?: number; entryName?: string },
    options?: { skip?: number; limit?: number }
  ): Promise<{ brackets?: KnockoutBracket[], pagination?: any } | KnockoutBracket[]> {
    if (!filter.entryId && !filter.entryName) {
      throw new Error("Provide either entryId or entryName");
    }

    let targetEntryId = filter.entryId;

    // Resolve entryId từ entryName
    if (!targetEntryId && filter.entryName) {
      const trimmed = filter.entryName.trim();
      const entry = await Entry.findOne({
        where: {
          categoryId,
          name: { [Op.like]: `%${trimmed}%` },
        },
      });
      if (!entry) throw new Error("Entry not found for the given name");
      targetEntryId = entry.id;
    }

    const skip = options?.skip || 0;
    const limit = options?.limit || 10;

    // If pagination is requested
    if (options && (options.skip !== undefined || options.limit !== undefined)) {
      const { count, rows } = await KnockoutBracket.findAndCountAll({
        where: {
          categoryId,
          [Op.or]: [
            { entryAId: targetEntryId },
            { entryBId: targetEntryId },
            { winnerEntryId: targetEntryId },
          ],
        },
        order: [
          ["roundNumber", "ASC"],
          ["bracketPosition", "ASC"],
        ],
        offset: skip,
        limit: limit,
      });

      const totalPages = Math.ceil(count / limit);
      const page = Math.floor(skip / limit) + 1;

      return {
        brackets: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    }

    return await KnockoutBracket.findAll({
      where: {
        categoryId,
        [Op.or]: [
          { entryAId: targetEntryId },
          { entryBId: targetEntryId },
          { winnerEntryId: targetEntryId },
        ],
      },
      order: [
        ["roundNumber", "ASC"],
        ["bracketPosition", "ASC"],
      ],
    });
  }

  // ── 5. Get toàn bộ bracket tree ───────────────────────────────────────────

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

    if (brackets.length === 0) {
      throw new Error("No bracket found for this category");
    }

    return formatBracketTree(categoryId, brackets);
  }

  // Thêm vào knockoutBracket.service.ts

  // ── 6. Validate bracket integrity ─────────────────────────────────────────

  /**
   * Kiểm tra bracket tree có hợp lệ trước khi bắt đầu giải:
   * - Tất cả bracket round 1 đã có đủ entries hoặc là bye
   * - Không có entry nào xuất hiện 2 lần
   * - Bracket tree liên kết đúng (nextBracketId / previousBracketId)
   * - Số lượng brackets đúng với bracket size
   */
  async validateBracketIntegrity(
    chiefRefereeId: number,
    categoryId: number,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const category = await getCategoryWithTournament(categoryId);
    await assertChiefReferee(chiefRefereeId, category.tournamentId);

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
    const expectedTotal = bracketSize - 1; // cây nhị phân hoàn chỉnh

    if (brackets.length !== expectedTotal) {
      errors.push(
        `Expected ${expectedTotal} brackets for bracket size ${bracketSize}, found ${brackets.length}`,
      );
    }

    // ── Check 2: Round 1 không có bracket nào thiếu cả 2 entry ───────────
    const round1 = brackets.filter((b) => b.roundNumber === 1);
    for (const b of round1) {
      if (!b.entryAId && !b.entryBId) {
        errors.push(
          `Bracket [round=1, position=${b.bracketPosition}] has no entries assigned`,
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
      // Final không có nextBracket
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

  // ── 7. Get standings ───────────────────────────────────────────────────────

  /**
   * Lấy kết quả xếp hạng cuối giải knockout:
   * - Vô địch: winner của Final
   * - Á quân: loser của Final
   * - Hạng 3: loser của 2 Semi-final (đồng hạng 3)
   */
  async getStandings(categoryId: number): Promise<{
  champion?: number;
  runnerUp?: number;
  thirdPlace?: number[];  // đồng hạng 3
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
    (b) => b.roundNumber === totalRounds && b.bracketPosition === 0
  );

  if (!final || final.status !== "completed") {
    throw new Error("Tournament is not completed yet");
  }

  const champion = final.winnerEntryId;
  const runnerUp =
    champion === final.entryAId ? final.entryBId : final.entryAId;

  // ── Đồng hạng 3: cả 2 loser của Semi-final ────────────────────────────
  const semiFinals = brackets.filter(
    (b) => b.roundNumber === totalRounds - 1
  );

  const thirdPlace: number[] = semiFinals
    .filter((b) => b.status === "completed" && b.winnerEntryId)
    .map((b) =>
      b.winnerEntryId === b.entryAId ? b.entryBId : b.entryAId
    )
    .filter((id): id is number => id != null);

  // ── Danh sách bị loại theo từng vòng ──────────────────────────────────
  const eliminated: { entryId: number; eliminatedAt: string }[] = [];

  for (const b of brackets) {
    if (b.status !== "completed" || !b.winnerEntryId || b.isByeMatch) continue;
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
    } = {
      eliminated,
    };

    if (champion != null) standings.champion = champion;
    if (runnerUp != null) standings.runnerUp = runnerUp;
    if (thirdPlace != null) standings.thirdPlace = thirdPlace;

    return standings;
}
}

// // match.service.ts
// async finalizeMatch(matchId: number): Promise<void> {
//   // ... cập nhật match
//   await knockoutBracketService.advanceWinner(
//     chiefRefereeId,
//     bracket.id,
//     winnerEntryId
//   );
// }

export default new KnockoutBracketService();
