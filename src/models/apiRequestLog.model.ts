import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import User from "./user.model";

const PATH_MAX_LENGTH = 500;
const ROUTE_MAX_LENGTH = 500;
const REQUEST_ID_MAX_LENGTH = 100;
const ERROR_CODE_MAX_LENGTH = 100;
const ERROR_MESSAGE_MAX_LENGTH = 500;
const IP_MAX_LENGTH = 100;
const USER_AGENT_MAX_LENGTH = 500;

@Table({
  tableName: "api_request_logs",
  timestamps: true,
  indexes: [
    { fields: ["createdAt"] },
    { fields: ["userId", "createdAt"] },
    { fields: ["statusCode", "createdAt"] },
    { fields: ["method", "createdAt"] },
    { fields: ["success", "createdAt"] },
  ],
})
export default class ApiRequestLog extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(REQUEST_ID_MAX_LENGTH),
    allowNull: true,
  })
  declare requestId?: string | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare userId?: number | null;

  @Column({
    type: DataType.STRING(10),
    allowNull: false,
  })
  declare method: string;

  @Column({
    type: DataType.STRING(PATH_MAX_LENGTH),
    allowNull: false,
  })
  declare path: string;

  @Column({
    type: DataType.STRING(ROUTE_MAX_LENGTH),
    allowNull: true,
  })
  declare route?: string | null;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare statusCode: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare success: boolean;

  @Column({
    type: DataType.STRING(ERROR_CODE_MAX_LENGTH),
    allowNull: true,
  })
  declare errorCode?: string | null;

  @Column({
    type: DataType.STRING(ERROR_MESSAGE_MAX_LENGTH),
    allowNull: true,
  })
  declare errorMessage?: string | null;

  @Column({
    type: DataType.STRING(IP_MAX_LENGTH),
    allowNull: true,
  })
  declare ip?: string | null;

  @Column({
    type: DataType.STRING(USER_AGENT_MAX_LENGTH),
    allowNull: true,
  })
  declare userAgent?: string | null;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare requestMeta?: unknown;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare responseMeta?: unknown;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare startedAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare finishedAt: Date;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare durationMs: number;

  @BelongsTo(() => User, { foreignKey: "userId" })
  declare user?: User;
}
