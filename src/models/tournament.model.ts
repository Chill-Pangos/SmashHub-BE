import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  ForeignKey,
  BelongsTo,
  BeforeValidate,
} from "sequelize-typescript";
import TournamentCategory from "./tournamentCategory.model";
import User from "./user.model";
import TournamentReferee from "./tournamentReferee.model";

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
    { fields: ["startDate"] },
    { fields: ["tier"] },
    { fields: ["status", "startDate"] },
    { fields: ["registrationStartDate"] },
    { fields: ["registrationEndDate"] },
    { fields: ["bracketGenerationDate"] },
    { fields: ["status", "registrationEndDate", "bracketGenerationDate"] },
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

  @Column({ type: DataType.DATE, allowNull: false })
  declare startDate: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare endDate: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare registrationStartDate: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare registrationEndDate: Date;

  @Column({ type: DataType.DATE, allowNull: false })
  declare bracketGenerationDate: Date;

  @Column({ type: DataType.STRING(100), allowNull: false })
  declare location: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  declare createdBy: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
  })
  declare numberOfTables: number;

  @BelongsTo(() => User)
  creator?: User;

  @HasMany(() => TournamentCategory)
  categories?: TournamentCategory[];

  @HasMany(() => TournamentReferee)
  referees?: TournamentReferee[];

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
  static validateNumberOfTables(instance: Tournament): void {
    const { numberOfTables } = instance;

    if (numberOfTables == null) return;

    if (!Number.isInteger(numberOfTables) || numberOfTables < TABLES_MIN) {
      throw new Error(`Number of tables must be at least ${TABLES_MIN}`);
    }
  }

  @BeforeValidate
  static validateDates(instance: Tournament): void {
    const {
      startDate,
      endDate,
      registrationStartDate,
      registrationEndDate,
      bracketGenerationDate,
      isNewRecord,
    } = instance;

    const now = new Date();

    // Khi tạo mới, startDate không được là quá khứ
    if (isNewRecord && startDate && startDate < now) {
      throw new Error("Start date cannot be in the past");
    }

    // Khi tạo mới, registrationStartDate không được là quá khứ
    if (isNewRecord && registrationStartDate && registrationStartDate < now) {
      throw new Error("Registration start date cannot be in the past");
    } 

    // endDate phải sau startDate
    if (startDate && endDate && endDate <= startDate) {
      throw new Error("End date must be after start date");
    }

    // registrationStartDate phải trước registrationEndDate
    if (
      registrationStartDate &&
      registrationEndDate &&
      registrationEndDate <= registrationStartDate
    ) {
      throw new Error("Registration end date must be after registration start date");
    }

    // Đăng ký phải đóng trước khi giải bắt đầu
    if (registrationEndDate && startDate && registrationEndDate >= startDate) {
      throw new Error("Registration must close before the tournament starts");
    }

    // Ngày tạo bracket phải sau khi đóng đăng ký
    if (
      bracketGenerationDate &&
      registrationEndDate &&
      bracketGenerationDate < registrationEndDate
    ) {
      throw new Error("Bracket generation date must be after registration end date");
    }

    // Ngày tạo bracket phải trước ngày bắt đầu ít nhất 2 ngày (48 giờ)
    if (bracketGenerationDate && startDate) {
      const twoDaysBeforeStart = new Date(startDate.getTime() - 2 * 24 * 60 * 60 * 1000);
 
      if (bracketGenerationDate > twoDaysBeforeStart) {
        throw new Error(
          "Bracket generation date must be at least 2 days (48 hours) before the start date",
        );
      }
    }
  }

  @BeforeValidate
  static validateName(instance: Tournament): void {
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
    const location = instance.location?.trim();

    if (!location) {
      throw new Error("Location cannot be empty");
    }
    if (location.length > 100) {
      throw new Error("Location must not exceed 100 characters");
    }
  }
}