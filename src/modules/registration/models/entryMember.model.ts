import {
  Table,
  Column,
  Model,
  DataType,
  BeforeValidate,
} from "sequelize-typescript";

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

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare entryId: number;

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

  declare entry?: any;

  declare user?: any;

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
