// Token DTOs
export interface CreateTokenDto {
  userId: number;
  type: "access" | "refresh";
  token: string;
  expiresAt: Date;
}

export interface UpdateTokenDto {
  isBlacklisted?: boolean;
  blacklistedAt?: Date;
}

export interface TokenResponseDto {
  id: number;
  userId: number;
  type: "access" | "refresh";
  token: string;
  expiresAt: Date;
  isBlacklisted: boolean;
  blacklistedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
