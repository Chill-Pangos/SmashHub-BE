// groupStanding.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BeforeValidate,
} from "sequelize-typescript";
import TournamentCategory from "./tournamentCategory.model";
import Entry from "./entry.model";

// ─── Constants ────────────────────────────────────────────────────────────────

const GROUP_NAME_MAX_LENGTH = 50;
const GROUP_NAME_REGEX = /^[\p{L}\p{N}\s\-]+$/u;
const MIN_POSITION = 1;

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "group_standings",
  timestamps: true,
  indexes: [
    { fields: ["entryId"] },
    { fields: ["categoryId", "groupName"] },
    { fields: ["categoryId", "position"] },
    {
      unique: true,
      fields: ["categoryId", "groupName", "entryId"], // 1 entry chỉ có 1 standing trong 1 bảng
    },
  ],
})
export default class GroupStanding extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => TournamentCategory)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare categoryId: number;

  @Column({
    type: DataType.STRING(GROUP_NAME_MAX_LENGTH),
    allowNull: false,
  })
  declare groupName: string;

  @ForeignKey(() => Entry)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare entryId: number;

  // ── Match statistics ───────────────────────────────────────────────────────

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  declare matchesPlayed: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  declare matchesWon: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  declare matchesLost: number;

  // ── Set statistics ─────────────────────────────────────────────────────────

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  declare setsWon: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  declare setsLost: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: "setsWon - setsLost",
  })
  declare setsDiff: number;

  // ── Ranking ────────────────────────────────────────────────────────────────

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare position?: number;

  // ─── Associations ──────────────────────────────────────────────────────────

  @BelongsTo(() => TournamentCategory, { foreignKey: "categoryId" })
  declare category?: TournamentCategory;

  @BelongsTo(() => Entry, { foreignKey: "entryId" })
  declare entry?: Entry;

  // ─── Validators ────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateGroupName(instance: GroupStanding): void {
    const trimmed = instance.groupName?.trim();

    if (!trimmed) {
      throw new Error("Group name is required");
    }
    if (trimmed.length > GROUP_NAME_MAX_LENGTH) {
      throw new Error(
        `Group name must not exceed ${GROUP_NAME_MAX_LENGTH} characters`
      );
    }
    if (!GROUP_NAME_REGEX.test(trimmed)) {
      throw new Error(
        "Group name must only contain letters, numbers, spaces, or hyphens"
      );
    }
  }

  @BeforeValidate
  static validateMatchStats(instance: GroupStanding): void {
    const { matchesPlayed, matchesWon, matchesLost } = instance;

    if (matchesWon + matchesLost > matchesPlayed) {
      throw new Error(
        "Sum of matches won and lost cannot exceed matches played"
      );
    }
  }

  @BeforeValidate
  static validateSetsDiff(instance: GroupStanding): void {
    const { setsWon, setsLost, setsDiff } = instance;

    if (setsDiff !== setsWon - setsLost) {
      throw new Error(
        "Sets diff must equal setsWon minus setsLost"
      );
    }
  }

  @BeforeValidate
  static validatePosition(instance: GroupStanding): void {
    const { position } = instance;

    if (position == null) return;

    if (!Number.isInteger(position) || position < MIN_POSITION) {
      throw new Error(`Position must be a positive integer`);
    }
  }
}