import { DataTypes, Model, Optional } from "sequelize";
import db from "../config/database";

interface TournamentContentAttributes {
  id: number;
  tournamentId: number;
  name: string;
  formatTypeId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TournamentContentCreationAttributes
  extends Optional<
    TournamentContentAttributes,
    "id" | "createdAt" | "updatedAt"
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
  public formatTypeId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
    formatTypeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "format_types",
        key: "id",
      },
    },
  },
  {
    sequelize: db,
    tableName: "tournament_contents",
    timestamps: true,
  }
);
