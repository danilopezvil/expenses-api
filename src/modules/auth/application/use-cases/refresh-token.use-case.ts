import { Injectable, Inject } from '@nestjs/common';
import { Result, ok, err } from '@shared/result/result';
import { ForbiddenError } from '@shared/errors/domain.errors';
import { IUserRepository } from '../../domain/ports/user-repository.port';
import { IRefreshTokenRepository } from '../../domain/ports/refresh-token-repository.port';
import { USER_REPOSITORY_PORT, REFRESH_TOKEN_REPOSITORY_PORT } from '../../domain/ports/injection-tokens';
import { AuthTokensDto } from '../dtos/auth-app.dto';
import { AuthTokenService } from '../services/auth-token.service';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT) private readonly userRepo: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY_PORT) private readonly tokenRepo: IRefreshTokenRepository,
    private readonly tokenService: AuthTokenService,
  ) {}

  async execute(data: { userId: string; tokenHash: string }): Promise<Result<AuthTokensDto, ForbiddenError>> {
    const user = await this.userRepo.findById(data.userId);
    if (!user || !user.active) return err(new ForbiddenError('User not found or inactive'));

    await this.tokenRepo.revokeByHash(data.tokenHash);
    const tokens = await this.tokenService.issue({ id: user.id, email: user.email, name: user.name });
    return ok(tokens);
  }
}
