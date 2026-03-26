import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Request } from 'express';
import { IRefreshTokenRepository } from '../../domain/ports/refresh-token-repository.port';
import { REFRESH_TOKEN_REPOSITORY_PORT } from '../../domain/ports/injection-tokens';

export interface RefreshTokenPayload {
  userId: string;
  tokenHash: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    config: ConfigService,
    @Inject(REFRESH_TOKEN_REPOSITORY_PORT)
    private readonly tokenRepo: IRefreshTokenRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string }): Promise<RefreshTokenPayload> {
    const rawToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!rawToken) throw new UnauthorizedException();

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = await this.tokenRepo.findByHash(tokenHash);

    if (!record || record.revoked || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }

    return { userId: payload.sub, tokenHash };
  }
}
