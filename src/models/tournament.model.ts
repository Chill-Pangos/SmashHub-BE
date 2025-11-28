import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({
  tableName: "tournaments",
  timestamps: true,
})
export default class Tournament extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
  })
  declare name: string;

  @Column({
    type: DataType.ENUM("upcoming", "ongoing", "completed"),
    allowNull: false,
    defaultValue: "upcoming",
  })
  declare status: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare startDate: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare endDate?: Date;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare location: string;
}
