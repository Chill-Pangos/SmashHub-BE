import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import SubMatch from './subMatch.model';

@Table({
  tableName: "match_sets",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["subMatchId", "setNumber"],
    },
  ],
})
export default class MatchSet extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => SubMatch)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare subMatchId: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare setNumber: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  declare entryAScore: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  })
  declare entryBScore: number;

  @BelongsTo(() => SubMatch)
  subMatch?: SubMatch;
}
