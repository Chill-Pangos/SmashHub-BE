import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({
  tableName: "permissions",
  timestamps: true,
})
export default class Permission extends Model {
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
}
