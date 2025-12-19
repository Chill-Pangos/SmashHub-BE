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
  tableName: "complaint_messages",
  timestamps: true,
})
export default class ComplaintMessage extends Model {
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

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: false,
  })
  declare senderId: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    allowNull: true,
  })
  declare receiverId: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare message: string;

  @Column({
    type: DataType.ENUM("comment", "request_info", "response"),
    allowNull: false,
    defaultValue: "comment",
  })
  declare messageType: "comment" | "request_info" | "response";

  @BelongsTo(() => Complaint)
  complaint?: Complaint;

  @BelongsTo(() => User, "senderId")
  sender?: User;

  @BelongsTo(() => User, "receiverId")
  receiver?: User;
}
