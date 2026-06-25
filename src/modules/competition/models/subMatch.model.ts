// subMatch.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  BeforeValidate,
} from "sequelize-typescript";

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_SUB_MATCH_NUMBER = 1;
const MAX_SUB_MATCH_NUMBER = 10;

export const SUB_MATCH_STATUSES = [
  "scheduled",
  "in_progress",
  "completed",
] as const;
export type SubMatchStatus = (typeof SUB_MATCH_STATUSES)[number];

export const TEAMS = ["A", "B"] as const;
export type Team = (typeof TEAMS)[number];

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "sub_matches",
  timestamps: true,
  indexes: [
    { fields: ["status"] },
    { fields: ["umpireId"] },
    { fields: ["matchId", "status"] },
    {
      unique: true,
      fields: ["matchId", "subMatchNumber"],
    },
  ],
})
export default class SubMatch extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare matchId: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare subMatchNumber: number;

  @Column({
    type: DataType.ENUM(...SUB_MATCH_STATUSES),
    allowNull: false,
    defaultValue: "scheduled" satisfies SubMatchStatus,
  })
  declare status: SubMatchStatus;

  @Column({
    type: DataType.ENUM(...TEAMS),
    allowNull: true,
  })
  declare winnerTeam?: Team;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
    comment: "Decided by referees before sub-match starts",
  })
  declare umpireId?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
    comment: "Optional — null if only 1 referee assigned to this match",
  })
  declare assistantUmpireId?: number;

  // ─── Associations ──────────────────────────────────────────────────────────

  declare match?: any;

  declare umpire?: any;

  declare assistantUmpire?: any;

  declare matchSets?: any[];

  declare subMatchPlayers?: any[];

  // ─── Validators ────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateSubMatchNumber(instance: SubMatch): void {
    if (instance.subMatchNumber === undefined) return;

    const { subMatchNumber } = instance;

    if (
      !Number.isInteger(subMatchNumber) ||
      subMatchNumber < MIN_SUB_MATCH_NUMBER ||
      subMatchNumber > MAX_SUB_MATCH_NUMBER
    ) {
      throw new Error(
        `Sub-match number must be an integer between ${MIN_SUB_MATCH_NUMBER} and ${MAX_SUB_MATCH_NUMBER}`
      );
    }
  }

  @BeforeValidate
  static validateWinnerTeam(instance: SubMatch): void {
    const { winnerTeam, status } = instance;

    if (winnerTeam == null) return;

    if (status !== "completed") {
      throw new Error(
        "Winner team can only be set when sub-match status is completed"
      );
    }
  }

  @BeforeValidate
  static validateUmpire(instance: SubMatch): void {
    if (instance.umpireId === undefined && instance.assistantUmpireId === undefined && instance.status === undefined) return;

    const { umpireId, assistantUmpireId, status } = instance;

    if (status === "in_progress" && umpireId == null) {
      throw new Error("Umpire must be assigned before sub-match starts");
    }

    if (
      umpireId != null &&
      assistantUmpireId != null &&
      umpireId === assistantUmpireId
    ) {
      throw new Error("Umpire and assistant umpire must be different users");
    }
  }
}
