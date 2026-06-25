export const PUBLIC_USER_ATTRIBUTES = [
  "id",
  "firstName",
  "lastName",
  "avatarUrl",
  "gender",
] as const;

export const PRIVATE_USER_ATTRIBUTES = [
  ...PUBLIC_USER_ATTRIBUTES,
  "email",
] as const;
