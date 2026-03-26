import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";

import Match from "./match.model";
import MatchSet from "./matchSet.model";
import User from "./user.model";
import subMatchPlayerService from "../services/subMatchPlayer.service";
import SubMatchPlayer from "./subMatchPlayer.model";

@Table({
    tableName: "sub_matches",
    timestamps: true,
    indexes: [
        { fields: ["status"] },
        { fields: ["matchId", "subMatchNumber"] },
    ],
})

export default class SubMatch extends Model {
    @Column({
        type: DataType.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    })
    declare id: number;

    @ForeignKey(() => Match)
    @Column({
        type: DataType.INTEGER.UNSIGNED,
        allowNull: false,
    })
    declare matchId: number;

    @Column({
        type: DataType.INTEGER.UNSIGNED,
        allowNull: false,
    })
    declare subMatchNumber: number;

    @Column({
        type: DataType.ENUM("in_progress", "completed"),
        allowNull: false,
    })
    declare status: string;

    @Column({
        type: DataType.ENUM("A", "B"),
        allowNull: true,
    })
    declare winnerTeam?: string;

    @BelongsTo(() => Match)
    match?: Match;

    @HasMany(() => MatchSet)
    matchSets?: MatchSet[];

    @HasMany(() => SubMatchPlayer)
    subMatchPlayers?: SubMatchPlayer[];
}