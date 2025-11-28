import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import TournamentContent from "./tournamentContent.model";

@Table({
  tableName: "content_rules",
  timestamps: true,
})
export default class ContentRule extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => TournamentContent)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare contentId: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare matchFormatId?: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare maxEntries: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare maxSets: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare racketCheck: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  declare isGroupStage?: boolean;

  @BelongsTo(() => TournamentContent)
  content?: TournamentContent;
}
