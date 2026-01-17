import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import User from "./user.model";
import Team from "./team.model";

@Table({
  tableName: "team_members",
  timestamps: true,
})
export default class TeamMember extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Team)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare teamId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare userId: number;

  @Column({
    type: DataType.ENUM("team_manager", "coach", "athlete"),
    allowNull: false,
    defaultValue: "athlete",
  })
  declare role: string;

  @BelongsTo(() => Team)
  team?: Team;

  @BelongsTo(() => User)
  user?: User;
}
