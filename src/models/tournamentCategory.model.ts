import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  BeforeValidate,
} from "sequelize-typescript";
import Tournament from "./tournament.model";
import Entry from "./entry.model";
import Schedule from "./schedule.model";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAME_MAX_LENGTH = 100;
const TEAM_FORMAT_REGEX = /^[SD](-[SD])+$/;
const VALID_SETS_DEFAULT = new Set([5, 7]);
const VALID_SETS_TEAM = new Set([5]);

const MIN_ENTRIES = {
  groupStage: 16,
  knockout: 32,
} as const;

export const CATEGORY_TYPES = ["single", "double", "team"] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

export const CATEGORY_GENDERS = ["male", "female", "mixed"] as const;
export type CategoryGender = (typeof CATEGORY_GENDERS)[number];

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "tournament_categories",  // đổi sang số nhiều cho nhất quán
  timestamps: true,
  indexes: [
    { fields: ["type"] },
    { fields: ["gender"] },
    { fields: ["isGroupStage"] },
    { fields: ["tournamentId", "type"] },
  ],
})
export default class TournamentCategory extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Tournament)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare tournamentId: number;

  @Column({ type: DataType.STRING(NAME_MAX_LENGTH), allowNull: false })
  declare name: string;

  @Column({
    type: DataType.ENUM(...CATEGORY_TYPES),
    allowNull: false,
  })
  declare type: CategoryType;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare maxEntries: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare maxSets: number;

  @Column({ type: DataType.STRING(50), allowNull: true })
  declare teamFormat?: string;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
  declare minAge?: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
  declare maxAge?: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
  declare minElo?: number;

  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: true })
  declare maxElo?: number;

  @Column({
    type: DataType.ENUM(...CATEGORY_GENDERS),
    allowNull: true,
  })
  declare gender?: CategoryGender;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isGroupStage: boolean;

  // ─── Associations ─────────────────────────────────────────────────────────

  @BelongsTo(() => Tournament, { foreignKey: "tournamentId" })
  declare tournament?: Tournament;

  @HasMany(() => Entry, { foreignKey: "categoryId" })
  declare entries?: Entry[];

  @HasMany(() => Schedule, { foreignKey: "categoryId" })
  declare schedules?: Schedule[];

  // ─── Validators ───────────────────────────────────────────────────────────

  @BeforeValidate
  static validateName(instance: TournamentCategory): void {
    const name = instance.name?.trim();

    if (!name) {
      throw new Error("Category name is required");
    }
    if (name.length > NAME_MAX_LENGTH) {
      throw new Error(
        `Category name must not exceed ${NAME_MAX_LENGTH} characters`
      );
    }
  }

  @BeforeValidate
  static validateGender(instance: TournamentCategory): void {
    const { gender, type } = instance;

    if (gender === "mixed" && type !== "double") {
      throw new Error("Only double categories can have mixed gender");
    }
  }

  @BeforeValidate
  static validateTeamFormat(instance: TournamentCategory): void {
    const { type, teamFormat } = instance;

    if (type === "team" && !teamFormat) {
      throw new Error("Team format is required for team categories");
    }
    if (type !== "team" && teamFormat) {
      throw new Error("Team format must be null for non-team categories");
    }
    if (!teamFormat) return;

    if (!TEAM_FORMAT_REGEX.test(teamFormat)) {
      throw new Error(
        "Team format must contain only S or D separated by hyphens (e.g. S-S-S, S-D-S-D-S)"
      );
    }

    const parts = teamFormat.split("-");

    if (parts.length % 2 === 0) {
      throw new Error("Team format must have an odd number of matches");
    }

    if (parts.length < 3) {
      throw new Error("Team format must have at least 3 matches");
    }
  }

  @BeforeValidate
  static validateMaxEntries(instance: TournamentCategory): void {
    const { maxEntries, isGroupStage } = instance;

    if (maxEntries == null) return;

    const minRequired = isGroupStage
      ? MIN_ENTRIES.groupStage
      : MIN_ENTRIES.knockout;

    if (maxEntries < minRequired) {
      throw new Error(
        `Max entries must be at least ${minRequired} for ${isGroupStage ? "group stage" : "knockout"} categories`
      );
    }

    if (maxEntries % 4 !== 0) {
      throw new Error("Max entries must be a multiple of 4");
    }
  }

  @BeforeValidate
  static validateMaxSets(instance: TournamentCategory): void {
    const { maxSets, type } = instance;

    if (maxSets == null) return;

    const validSets = type === "team" ? VALID_SETS_TEAM : VALID_SETS_DEFAULT;

    if (!validSets.has(maxSets)) {
      const allowed = [...validSets].join(" or ");
      throw new Error(`Max sets for ${type} categories must be ${allowed}`);
    }
  }

  @BeforeValidate
  static validateAgeRange(instance: TournamentCategory): void {
    TournamentCategory.assertRange("Age", instance.minAge, instance.maxAge);
  }

  @BeforeValidate
  static validateEloRange(instance: TournamentCategory): void {
    TournamentCategory.assertRange("ELO", instance.minElo, instance.maxElo);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private static assertRange(
    label: string,
    min?: number,
    max?: number
  ): void {
    if (min != null && min < 0) {
      throw new Error(`Min ${label} cannot be negative`);
    }
    if (max != null && max < 0) {
      throw new Error(`Max ${label} cannot be negative`);
    }
    if (min != null && max != null && min > max) {
      throw new Error(`Min ${label} cannot be greater than max ${label}`);
    }
  }
}