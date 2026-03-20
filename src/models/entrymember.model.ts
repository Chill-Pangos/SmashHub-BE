import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import User from "./user.model";
import Entries from "./entry.model";

@Table({
  tableName: "entry_members",
  timestamps: true,
  indexes: [
    { fields: ["userId"] },
    { fields: ["entryId", "userId"] },
  ],
})
export default class EntryMember extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Entries)
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

  @BelongsTo(() => Entries)
  entry?: Entries;

  @BelongsTo(() => User)
  user?: User;
}
