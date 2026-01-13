import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({
  tableName: "match_formats",
  timestamps: true,
})
export default class MatchFormat extends Model {
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
  declare numberOfSingles: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare numberOfDoubles: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare description: string;
}
