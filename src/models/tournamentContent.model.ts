import { DataTypes, Model, Optional } from "sequelize";
import db from "../config/database";

interface TournamentContentAttributes {
  id: number;
  tournamentId: number;
  name: string;
  formatType: string;
  createdAt?: Date;
  updateAt?: Date;
}

interface TournamentContentCreationAttributes
  extends Optional<
    TournamentContentAttributes,
    "id" | "createdAt" | "updateAt"
  > {}

export class TournamentContent
  extends Model<
    TournamentContentAttributes,
    TournamentContentCreationAttributes
  >
  implements TournamentContentAttributes
{
  public id!: number;
  public tournamentId!: number;
  public name!: string;
  public formatType!: string;
  public readonly createdAt!: Date;
  public readonly updateAt!: Date;
}

TournamentContent.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    tournamentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "tournaments",
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    formatType: {
      type: DataTypes.ENUM(
        "single_elimination",
        "double_elimination",
        "round_robin"
      ),
      allowNull: false,
    },
  },
  {
    sequelize: db,
    tableName: "tournament_contents",
    timestamps: true,
  }
);
