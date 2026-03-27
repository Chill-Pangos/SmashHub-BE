import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";
import TournamentCategory from "./tournamentCategory.model";
import Match from "./match.model";
import Team from "./team.model";
import User from "./user.model";
import EntryMember from "./entryMember.model";

@Table({
  tableName: "entries",
  timestamps: true,
  indexes: [
    { fields: ["categoryId"] },
    { fields: ["teamId"] },
    { fields: ["isAcceptingMembers", "currentMemberCount", "requiredMemberCount"] },
    { fields: ["teamCaptainId"] },
  ],
})
export default class Entry extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => TournamentCategory)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare categoryId: number;

  @ForeignKey(() => Team)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare teamId: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isAcceptingMembers: boolean;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare requiredMemberCount?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare currentMemberCount?: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare teamCaptainId?: number;

  @BelongsTo(() => TournamentCategory)
  category?: TournamentCategory;

  @BelongsTo(() => Team)
  team?: Team;

  @BelongsTo(() => User)
  teamCaptain?: User;

  @HasMany(() => EntryMember)
  members?: EntryMember[];

  @HasMany(() => Match, "entryAId")
  matchesAsA?: Match[];

  @HasMany(() => Match, "entryBId")
  matchesAsB?: Match[];

  @HasMany(() => Match, "winnerEntryId")
  wonMatches?: Match[];
}