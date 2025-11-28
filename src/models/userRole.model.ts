import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import User from "./user.model";
import Role from "./role.model";

@Table({
  tableName: "user_roles",
  timestamps: true,
})
export default class UserRole extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare userId: number;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare roleId: number;

  @BelongsTo(() => User)
  user?: User;

  @BelongsTo(() => Role)
  role?: Role;
}
