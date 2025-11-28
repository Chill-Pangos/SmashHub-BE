import { DataTypes, ENUM, Model, Optional } from "sequelize";
import db from "../config/database";

interface ContentRuleAttributes {
  id: number;
  contentId: number;
  matchFormatId?: number;
  maxEntries: number;
  maxSets: number;
  racketCheck: boolean;
  isGroupStage?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ContentRuleCreationAttributes
  extends Optional<
    ContentRuleAttributes,
    "id" | "createdAt" | "updatedAt" | "matchFormatId"
  > {}

export class ContentRule
  extends Model<ContentRuleAttributes, ContentRuleCreationAttributes>
  implements ContentRuleAttributes
{
  public id!: number;
  public contentId!: number;
  public maxEntries!: number;
  public maxSets!: number;
  public racketCheck!: boolean;
  public matchFormatId?: number;
  public isGroupStage?: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}
ContentRule.init(
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
    maxEntries: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    maxSets: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    racketCheck: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    matchFormatId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    isGroupStage: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    tableName: "content_rules",
    timestamps: true,
  }
);
