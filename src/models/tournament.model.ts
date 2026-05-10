import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  HasOne,
  ForeignKey,
  BelongsTo,
  BeforeValidate,
} from "sequelize-typescript";
import TournamentCategory from "./tournamentCategory.model";
import User from "./user.model";
import TournamentReferee from "./tournamentReferee.model";
import ScheduleConfig from "./scheduleConfig.model";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_MIN = 1;
const TIER_MAX = 5;
const TABLES_MIN = 1;

export type TournamentStatus =
  | "upcoming"
  | "registration_open"
  | "registration_closed"
  | "brackets_generated"
  | "ongoing"
  | "completed"
  | "cancelled";

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "tournaments",
  timestamps: true,
  indexes: [
    { fields: ["createdBy"] },
    { fields: ["tier"] },
  ],
})
export default class Tournament extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  declare name: string;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare tier: number;

  @Column({
    type: DataType.ENUM(
      "upcoming",
      "registration_open",
      "registration_closed",
      "brackets_generated",
      "ongoing",
      "completed",
      "cancelled",
    ),
    allowNull: false,
    defaultValue: "upcoming",
  })
  declare status: TournamentStatus;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare location: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare createdBy: number;

  @BelongsTo(() => User)
  creator?: User;

  @HasMany(() => TournamentCategory)
  categories?: TournamentCategory[];

  @HasMany(() => TournamentReferee)
  referees?: TournamentReferee[];

  @HasOne(() => ScheduleConfig)
  scheduleConfig?: ScheduleConfig;

  // ─── Validators ─────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateTier(instance: Tournament): void {
    const { tier } = instance;

    if (tier == null) return;

    if (!Number.isInteger(tier) || tier < TIER_MIN || tier > TIER_MAX) {
      throw new Error(`Tier must be an integer between ${TIER_MIN} and ${TIER_MAX}`);
    }
  }



  @BeforeValidate
  static validateName(instance: Tournament): void {
    // Skip validation if name is not being updated (during update operations)
    if (instance.name === undefined) return;

    const name = instance.name?.trim();

    if (!name) {
      throw new Error("Tournament name cannot be empty");
    }
    if (name.length < 3) {
      throw new Error("Tournament name must be at least 3 characters");
    }
    if (name.length > 255) {
      throw new Error("Tournament name must not exceed 255 characters");
    }
  }

  @BeforeValidate
  static validateLocation(instance: Tournament): void {
    // Skip validation if location is not being updated (during update operations)
    if (instance.location === undefined) return;

    const location = instance.location?.trim();

    if (!location) {
      throw new Error("Location cannot be empty");
    }
    if (location.length > 100) {
      throw new Error("Location must not exceed 100 characters");
    }
  }
}