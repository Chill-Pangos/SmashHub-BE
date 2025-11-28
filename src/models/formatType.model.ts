import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({
  tableName: "format_types",
  timestamps: true,
})
export default class FormatType extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare typeName: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description?: string;
}
