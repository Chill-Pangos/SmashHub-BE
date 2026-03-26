import {
  Table,
  Column,
  Model,
  DataType,
  HasOne,
  HasMany,
  BelongsToMany,
  BelongsTo,
} from "sequelize-typescript";
import EloScore from "./eloScore.model";
import EloHistory from "./eloHistory.model";
import UserRole from "./userRole.model";
import Role from "./role.model";
import EntryMember from "./entryMember.model";

@Table({
  tableName: "users",
  timestamps: true,
  indexes: [
    { fields: ["dob"] },
  ],
})
export default class User extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare firstName: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare lastName: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare password: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isEmailVerified: boolean;

  @Column({
    type: DataType.ENUM('male', 'female', 'other'),
    allowNull: true,
  })
  declare gender?: string;

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

  @HasOne(() => EloScore)
  eloScore?: EloScore;

  @HasMany(() => EloHistory)
  eloHistories?: EloHistory[];

  @HasMany(() => EntryMember)
  entryMembers?: EntryMember[];

  @BelongsToMany(() => Role, () => UserRole)
  roles?: Role[];


}
