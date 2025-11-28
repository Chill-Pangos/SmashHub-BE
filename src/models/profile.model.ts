import { DataTypes, Model, Optional } from "sequelize";
import db from "../config/database";

interface ProfileAttributes {
  id: number;
  userId: number;
  avatarUrl?: string;
  dob?: Date;
  phoneNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProfileCreationAttributes
  extends Optional<ProfileAttributes, "id" | "createdAt" | "updatedAt"> {}

export class Profile
  extends Model<ProfileAttributes, ProfileCreationAttributes>
  implements ProfileAttributes
{
  public id!: number;
  public userId!: number;
  public avatarUrl?: string;
  public dob?: Date;
  public phoneNumber?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Profile.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    avatarUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    dob: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    sequelize: db,
    tableName: "profiles",
    timestamps: true,
  }
);
