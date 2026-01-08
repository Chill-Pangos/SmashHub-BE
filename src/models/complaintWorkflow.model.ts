import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
  BelongsTo,
} from "sequelize-typescript";
import Complaint from "./complaint.model";
import User from "./user.model";

@Table({
  tableName: "complaint_workflow",
  timestamps: true,
})
export default class ComplaintWorkflow extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @ForeignKey(() => Complaint)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare complaintId: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare fromRole: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  declare toRole: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare fromUserId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare toUserId: number;

  @Column({
    type: DataType.ENUM(
      "submit",
      "forward",
      "approve",
      "reject",
      "request_info"
    ),
    allowNull: true,
  })
  declare action: "submit" | "forward" | "approve" | "reject" | "request_info";

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare note: string;

  @BelongsTo(() => Complaint)
  complaint?: Complaint;

  @BelongsTo(() => User, "fromUserId")
  fromUser?: User;

  @BelongsTo(() => User, "toUserId")
  toUser?: User;
}
