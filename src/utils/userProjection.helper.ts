export const PUBLIC_USER_ATTRIBUTES = [
  "id",
  "firstName",
  "lastName",
  "email",
  "avatarUrl",
  "gender",
  "dob",
  "phoneNumber",
  "isEmailVerified",
  "createdAt",
  "updatedAt",
] as const;

export const PRIVATE_USER_ATTRIBUTES = [
  ...PUBLIC_USER_ATTRIBUTES,
] as const;
