import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthController } from './auth.controller';

// Application
import { AuthTokenService } from '../../application/services/auth-token.service';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';

// Event handlers
import { UserLoggedInHandler } from '../../application/event-handlers/user-logged-in.handler';

// Infrastructure
import { PrismaUserRepository } from '../../infrastructure/persistence/prisma-user.repository';
import { PrismaRefreshTokenRepository } from '../../infrastructure/persistence/prisma-refresh-token.repository';
import { JwtRefreshStrategy } from '../../infrastructure/jwt/jwt-refresh.strategy';

// Tokens
import {
  USER_REPOSITORY_PORT,
  REFRESH_TOKEN_REPOSITORY_PORT,
} from '../../domain/ports/injection-tokens';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    CqrsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '1h') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Application
    AuthTokenService,
    RegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,

    // Event handlers
    UserLoggedInHandler,

    // Infrastructure
    JwtRefreshStrategy,

    // Port → Adapter
    { provide: USER_REPOSITORY_PORT, useClass: PrismaUserRepository },
    { provide: REFRESH_TOKEN_REPOSITORY_PORT, useClass: PrismaRefreshTokenRepository },
  ],
})
export class AuthModule {}
