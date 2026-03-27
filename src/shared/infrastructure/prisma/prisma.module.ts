import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { PrismaGroupMembershipRepository } from '../persistence/prisma-group-membership.repository';
import { GROUP_MEMBERSHIP_REPOSITORY_PORT } from '../../domain/ports/group-membership-repository.port';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    PrismaService,
    {
      provide: GROUP_MEMBERSHIP_REPOSITORY_PORT,
      useClass: PrismaGroupMembershipRepository,
    },
  ],
  exports: [PrismaService, GROUP_MEMBERSHIP_REPOSITORY_PORT],
})
export class PrismaModule {}
