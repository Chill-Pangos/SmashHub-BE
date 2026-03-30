// entry.model.ts
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
import TournamentCategory from "./tournamentCategory.model";
import Match from "./match.model";
import User from "./user.model";
import EntryMember from "./entryMember.model";

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_REQUIRED_MEMBERS = 1;
const MAX_REQUIRED_MEMBERS = 100;

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "entries",
  timestamps: true,
  indexes: [
    { fields: ["categoryId"] },
    { fields: ["captainId"] },
    { fields: ["isAcceptingMembers"] },
  ],
})
export default class Entry extends Model {
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

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare captainId?: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isAcceptingMembers: boolean;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare requiredMemberCount?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  declare currentMemberCount: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "Captain has confirmed the final lineup",
  })
  declare isConfirmed: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare confirmedAt?: Date;

  // ─── Associations ──────────────────────────────────────────────────────────

  @BelongsTo(() => TournamentCategory, { foreignKey: "categoryId" })
  declare category?: TournamentCategory;

  @BelongsTo(() => User, { foreignKey: "captainId" })
  declare captain?: User;

  @HasMany(() => EntryMember, { foreignKey: "entryId" })
  declare members?: EntryMember[];

  @HasMany(() => Match, { foreignKey: "entryAId" })
  declare matchesAsA?: Match[];

  @HasMany(() => Match, { foreignKey: "entryBId" })
  declare matchesAsB?: Match[];

  @HasMany(() => Match, { foreignKey: "winnerEntryId" })
  declare wonMatches?: Match[];

  // ─── Validators ────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateRequiredMemberCount(instance: Entry): void {
    const { requiredMemberCount } = instance;

    if (requiredMemberCount == null) return;

    if (
      !Number.isInteger(requiredMemberCount) ||
      requiredMemberCount < MIN_REQUIRED_MEMBERS ||
      requiredMemberCount > MAX_REQUIRED_MEMBERS
    ) {
      throw new Error(
        `Required member count must be an integer between ${MIN_REQUIRED_MEMBERS} and ${MAX_REQUIRED_MEMBERS}`,
      );
    }
  }

  @BeforeValidate
  static validateCurrentMemberCount(instance: Entry): void {
    const { currentMemberCount, requiredMemberCount } = instance;

    if (!Number.isInteger(currentMemberCount) || currentMemberCount < 0) {
      throw new Error("Current member count must be a non-negative integer");
    }

    if (
      requiredMemberCount != null &&
      currentMemberCount > requiredMemberCount
    ) {
      throw new Error(
        "Current member count must not exceed required member count",
      );
    }
  }

  @BeforeValidate
  static validateAcceptingMembers(instance: Entry): void {
    const { isAcceptingMembers, requiredMemberCount } = instance;

    if (isAcceptingMembers && requiredMemberCount == null) {
      throw new Error(
        "requiredMemberCount must be set when entry is accepting members",
      );
    }
  }

  @BeforeValidate
static validateConfirmedAt(instance: Entry): void {
  const { isConfirmed, confirmedAt } = instance;

  if (confirmedAt && !isConfirmed) {
    throw new Error("confirmedAt can only be set when isConfirmed is true");
  }
  if (isConfirmed && !confirmedAt) {
    throw new Error("confirmedAt must be set when isConfirmed is true");
  }
}
}
