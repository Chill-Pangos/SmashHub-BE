import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import User from "./user.model";

@Table({
  tableName: "profiles",
  timestamps: true,
})
export default class Profile extends Model {
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

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare avatarUrl?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare dob?: Date;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  declare phoneNumber?: string;

  @BelongsTo(() => User)
  user?: User;
}
