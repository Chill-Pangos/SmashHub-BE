import {
  Table,
  Column,
  Model,
  DataType,
} from "sequelize-typescript";

const ACTION_MAX_LENGTH = 100;
const RESOURCE_MAX_LENGTH = 100;
const PATH_MAX_LENGTH = 500;
const IP_MAX_LENGTH = 100;
const USER_AGENT_MAX_LENGTH = 500;

@Table({
  tableName: "audit_logs",
  timestamps: true,
  indexes: [
    { fields: ["actorUserId", "createdAt"] },
    { fields: ["action", "createdAt"] },
    { fields: ["resourceType", "resourceId"] },
    { fields: ["statusCode", "createdAt"] },
  ],
})
export default class AuditLog extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare actorUserId?: number | null;

  @Column({
    type: DataType.STRING(ACTION_MAX_LENGTH),
    allowNull: false,
  })
  declare action: string;

  @Column({
    type: DataType.STRING(RESOURCE_MAX_LENGTH),
    allowNull: true,
  })
  declare resourceType?: string | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  declare resourceId?: string | null;

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
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare statusCode?: number | null;

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
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare durationMs?: number | null;

  declare actor?: any;
}
