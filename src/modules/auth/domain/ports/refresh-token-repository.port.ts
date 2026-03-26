export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  revoked: boolean;
  expiresAt: Date;
}

export interface CreateRefreshTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface IRefreshTokenRepository {
  create(data: CreateRefreshTokenData): Promise<RefreshTokenRecord>;
  findByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revokeByHash(tokenHash: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
}
