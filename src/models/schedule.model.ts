import { DataTypes, Model, Optional } from "sequelize";
import db from "../config/database";

interface ScheduleAttributes {
  id: number;
  contentId: number;
  roundNumber?: number;
  groupName?: string;
  scheduledAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ScheduleCreationAttributes
  extends Optional<
    ScheduleAttributes,
    "id" | "createdAt" | "updatedAt" | "roundNumber" | "groupName"
  > {}

export class Schedule
  extends Model<ScheduleAttributes, ScheduleCreationAttributes>
  implements ScheduleAttributes
{
  public id!: number;
  public contentId!: number;
  public roundNumber?: number;
  public groupName?: string;
  public scheduledAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Schedule.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    contentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "tournament_contents",
        key: "id",
      },
    },
    roundNumber: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    groupName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    tableName: "schedules",
    timestamps: true,
  }
);
