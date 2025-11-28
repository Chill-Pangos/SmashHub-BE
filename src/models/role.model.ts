import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({
  tableName: "roles",
  timestamps: true,
})
export default class Role extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  declare name: string;
}
