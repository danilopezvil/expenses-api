import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { JwtStrategy } from './shared/infrastructure/strategies/jwt.strategy';

// Feature modules
import { AuthModule } from './modules/auth/delivery/http/auth.module';
import { ExpensesModule } from './modules/expenses/delivery/http/expenses.module';
import { GroupsModule } from './modules/groups/delivery/http/groups.module';
import { MembersModule } from './modules/members/delivery/http/members.module';
import { AccountsModule } from './modules/accounts/delivery/http/accounts.module';
import { PaymentsModule } from './modules/payments/delivery/http/payments.module';
import { ImportsModule } from './modules/imports/delivery/http/imports.module';
import { ExportsModule } from './modules/exports/delivery/http/exports.module';
import { DashboardModule } from './modules/dashboard/delivery/http/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        level: process.env['NODE_ENV'] !== 'production' ? 'debug' : 'info',
      },
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60000),
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '1h') },
      }),
    }),

    PrismaModule,

    // Feature modules
    AuthModule,
    ExpensesModule,
    GroupsModule,
    MembersModule,
    AccountsModule,
    PaymentsModule,
    ImportsModule,
    ExportsModule,
    DashboardModule,
  ],
  providers: [JwtStrategy],
})
export class AppModule {}
