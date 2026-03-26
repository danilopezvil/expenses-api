import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  IRefreshTokenRepository,
} from '../../domain/ports/refresh-token-repository.port';
import { REFRESH_TOKEN_REPOSITORY_PORT } from '../../domain/ports/injection-tokens';
import { AuthTokensDto, AuthUserDto } from '../dtos/auth-app.dto';

@Injectable()
export class AuthTokenService {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY_PORT)
    private readonly tokenRepo: IRefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issue(user: AuthUserDto): Promise<AuthTokensDto> {
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, name: user.name },
    );

    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    const refreshExpiryDays = this.config.get<number>('JWT_REFRESH_EXPIRES_DAYS', 30);
    const rawRefreshToken = this.jwtService.sign(
      { sub: user.id },
      { secret: refreshSecret, expiresIn: `${refreshExpiryDays}d` },
    );

    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + refreshExpiryDays * 24 * 60 * 60 * 1000);
    await this.tokenRepo.create({ userId: user.id, tokenHash, expiresAt });

    return { accessToken, refreshToken: rawRefreshToken, user };
  }
}
