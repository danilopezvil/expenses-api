import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

const RETRY_ATTEMPTS = 8;
const RETRY_DELAY_MS = 3_000;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    const url = config.getOrThrow<string>('DATABASE_URL');
    //console.log('>>> DATABASE_URL:', url); // log temporal
    super({
      datasources: {
        db: { url: config.getOrThrow<string>('DATABASE_URL') },
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.connectWithRetry();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  private async connectWithRetry(attempt = 1): Promise<void> {
    try {
      await this.$connect();
      if (attempt > 1) {
        this.logger.log(`Database connected after ${attempt} attempts`);
      }
    } catch (error) {
      if (attempt >= RETRY_ATTEMPTS) {
        this.logger.error(`Could not connect to database after ${RETRY_ATTEMPTS} attempts`);
        throw error;
      }
      this.logger.warn(
        `Database not ready (attempt ${attempt}/${RETRY_ATTEMPTS}), retrying in ${RETRY_DELAY_MS}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return this.connectWithRetry(attempt + 1);
    }
  }
}
