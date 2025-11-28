import { DataTypes, Model, Optional } from "sequelize";
import db from "../config/database";

interface EntryMemberAttributes {
  id: number;
  entryId: number;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EntryMemberCreationAttributes
  extends Optional<EntryMemberAttributes, "id" | "createdAt" | "updatedAt"> {}

export class EntryMember
  extends Model<EntryMemberAttributes, EntryMemberCreationAttributes>
  implements EntryMemberAttributes
{
  public id!: number;
  public entryId!: number;
  public userId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EntryMember.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    entryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "entries",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    sequelize: db,
    tableName: "entry_members",
    timestamps: true,
  }
);
