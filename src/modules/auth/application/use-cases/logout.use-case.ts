import { Injectable, Inject } from '@nestjs/common';
import * as crypto from 'crypto';
import { Result, ok } from '@shared/result/result';
import { IRefreshTokenRepository } from '../../domain/ports/refresh-token-repository.port';
import { REFRESH_TOKEN_REPOSITORY_PORT } from '../../domain/ports/injection-tokens';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY_PORT) private readonly tokenRepo: IRefreshTokenRepository,
  ) {}

  async execute(rawRefreshToken: string): Promise<Result<void, never>> {
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    await this.tokenRepo.revokeByHash(tokenHash);
    return ok(undefined);
  }
}
