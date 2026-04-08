import {
  Table,
  Column,
  Model,
  DataType,
  HasOne,
  HasMany,
  BelongsToMany,
  BeforeValidate,
} from "sequelize-typescript";
import EloScore from "./eloScore.model";
import EloHistory from "./eloHistory.model";
import UserRole from "./userRole.model";
import Role from "./role.model";
import EntryMember from "./entryMember.model";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAME_MAX_LENGTH = 50;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s\-().]{7,20}$/;
const MIN_AGE = 10;
const MAX_AGE = 100;

export type UserGender = "male" | "female";

// ─── Model ────────────────────────────────────────────────────────────────────

@Table({
  tableName: "users",
  timestamps: true,
  indexes: [
    { fields: ["dob"] },
    { fields: ["email"] },       
    { fields: ["phoneNumber"] },
  ],
})
export default class User extends Model {
  @Column({
    type: DataType.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({ type: DataType.STRING(50), allowNull: false })
  declare firstName: string;

  @Column({ type: DataType.STRING(50), allowNull: false })
  declare lastName: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare password: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare isEmailVerified: boolean;

  @Column({
    type: DataType.ENUM("male", "female"),
    allowNull: true,
  })
  declare gender?: UserGender;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare avatarUrl?: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare dob?: Date;

  @Column({ type: DataType.STRING(20), allowNull: true })
  declare phoneNumber?: string;

  @HasOne(() => EloScore)
  eloScore?: EloScore;

  @HasMany(() => EloHistory)
  eloHistories?: EloHistory[];

  @HasMany(() => EntryMember)
  entryMembers?: EntryMember[];

  @BelongsToMany(() => Role, () => UserRole)
  roles?: Role[];

  // ─── Validators ─────────────────────────────────────────────────────────────

  @BeforeValidate
  static validateName(instance: User): void {
    // Skip validation if name fields are not being updated
    if (instance.firstName === undefined && instance.lastName === undefined) return;

    const firstName = instance.firstName?.trim();
    const lastName = instance.lastName?.trim();

    if (!firstName) {
      throw new Error("First name cannot be empty");
    }
    if (!lastName) {
      throw new Error("Last name cannot be empty");
    }
    if (firstName.length > NAME_MAX_LENGTH) {
      throw new Error(`First name must not exceed ${NAME_MAX_LENGTH} characters`);
    }
    if (lastName.length > NAME_MAX_LENGTH) {
      throw new Error(`Last name must not exceed ${NAME_MAX_LENGTH} characters`);
    }
  }

  @BeforeValidate
  static validateEmail(instance: User): void {
    // Skip validation if email is not being updated
    if (instance.email === undefined) return;

    const email = instance.email?.trim();

    if (!email) {
      throw new Error("Email cannot be empty");
    }
    if (!EMAIL_REGEX.test(email)) {
      throw new Error("Invalid email format");
    }
    if (email.length > 100) {
      throw new Error("Email must not exceed 100 characters");
    }
  }

  @BeforeValidate
  static validatePassword(instance: User): void {
    // Skip validation if password is not being updated
    if (instance.password === undefined) return;

    const { password } = instance;

    if (!password) {
      throw new Error("Password cannot be empty");
    }

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
  }

  @BeforeValidate
  static validateDob(instance: User): void {
    // Skip validation if dob is not being updated
    if (instance.dob === undefined) return;

    const { dob } = instance;

    if (!dob) return;

    const today = new Date();
    const birthDate = new Date(dob);

    if (birthDate >= today) {
      throw new Error("Date of birth must be in the past");
    }

    const age = today.getFullYear() - birthDate.getFullYear();
    const hadBirthdayThisYear =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() >= birthDate.getDate());
    const actualAge = hadBirthdayThisYear ? age : age - 1;

    if (actualAge < MIN_AGE) {
      throw new Error(`User must be at least ${MIN_AGE} years old`);
    }
    if (actualAge > MAX_AGE) {
      throw new Error(`User age must not exceed ${MAX_AGE} years`);
    }
  }

  @BeforeValidate
  static validatePhoneNumber(instance: User): void {
    // Skip validation if phoneNumber is not being updated
    if (instance.phoneNumber === undefined) return;

    const { phoneNumber } = instance;

    if (!phoneNumber) return;

    if (!PHONE_REGEX.test(phoneNumber)) {
      throw new Error("Invalid phone number format");
    }
  }
}