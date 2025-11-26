import { DataTypes, Model, Optional } from "sequelize";
import db from "../config/database";

interface TournamentAttributes {
  id: number;
  name: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  status: string;
  createdAt?: Date;
  updateAt?: Date;
}

interface TournamentCreationAttributes
  extends Optional<TournamentAttributes, "id" | "createdAt" | "updateAt"> {}

export class Tournament
  extends Model<TournamentAttributes, TournamentCreationAttributes>
  implements TournamentAttributes
{
  public id!: number;
  public name!: string;
  public startDate!: Date;
  public endDate?: Date;
  public location!: string;
  public status!: string;
  public readonly createdAt!: Date;
  public readonly updateAt!: Date;
}

Tournament.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM("upcoming", "ongoing", "completed"),
      allowNull: false,
      defaultValue: "upcoming",
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
  },
  {
    sequelize: db,
    tableName: "tournaments",
    timestamps: true,
  }
);
