import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BeforeValidate,
} from "sequelize-typescript";
import User from "./user.model";
import Entry from "./entry.model";

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_ELO = 0;
const MAX_ELO = 10000;

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "entry_members",
  timestamps: true,
  indexes: [
    { fields: ["userId"] },
    { fields: ["entryId"] },
    {
      unique: true,
      fields: ["entryId", "userId"],
    },
  ],
})
export default class EntryMember extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Entry)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare entryId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare userId: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare eloAtEntry: number;

  // ─── Associations ──────────────────────────────────────────────────────────

  @BelongsTo(() => Entry, { foreignKey: "entryId" })
  declare entry?: Entry;

  @BelongsTo(() => User, { foreignKey: "userId" })
  declare user?: User;

  // ─── Validators ────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateEloAtEntry(instance: EntryMember): void {
    if (instance.eloAtEntry === undefined) return;

    const { eloAtEntry } = instance;

    if (!Number.isInteger(eloAtEntry) || eloAtEntry < MIN_ELO || eloAtEntry > MAX_ELO) {
      throw new Error(
        `ELO at entry must be an integer between ${MIN_ELO} and ${MAX_ELO}`
      );
    }
  }
}