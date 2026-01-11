import {
  Table,
  Column,
  Model,
  DataType,
  HasOne,
  HasMany,
  BelongsToMany,
} from "sequelize-typescript";
import Profile from "./profile.model";
import EloScore from "./eloScore.model";
import EloHistory from "./eloHistory.model";
import UserRole from "./userRole.model";
import Role from "./role.model";
import EntryMember from "./entrymember.model";
import Complaint from "./complaint.model";
import ComplaintMessage from "./complaintMessage.model";
import ComplaintWorkflow from "./complaintWorkflow.model";
import { Col } from "sequelize/types/utils";

@Table({
  tableName: "users",
  timestamps: true,
})
export default class User extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  declare username: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare password: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isEmailVerified: boolean;

  @HasOne(() => Profile)
  profile?: Profile;

  @HasOne(() => EloScore)
  eloScore?: EloScore;

  @HasMany(() => EloHistory)
  eloHistories?: EloHistory[];

  @HasMany(() => EntryMember)
  entryMembers?: EntryMember[];

  @HasMany(() => Complaint, "createdBy")
  createdComplaints?: Complaint[];

  @HasMany(() => Complaint, "currentHandlerId")
  handlingComplaints?: Complaint[];

  @HasMany(() => ComplaintMessage, "senderId")
  sentMessages?: ComplaintMessage[];

  @HasMany(() => ComplaintMessage, "receiverId")
  receivedMessages?: ComplaintMessage[];

  @HasMany(() => ComplaintWorkflow, "fromUserId")
  workflowsFrom?: ComplaintWorkflow[];

  @HasMany(() => ComplaintWorkflow, "toUserId")
  workflowsTo?: ComplaintWorkflow[];

  @BelongsToMany(() => Role, () => UserRole)
  roles?: Role[];
}
