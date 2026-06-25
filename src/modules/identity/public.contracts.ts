export interface PublicUserSummary {
  id: number;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface RegistrationUserSummary extends PublicUserSummary {
  email?: string;
  gender?: "male" | "female";
  dob?: Date | string;
}
