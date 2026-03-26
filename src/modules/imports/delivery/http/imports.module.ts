import { Module } from '@nestjs/common';
import { ImportsController } from './imports.controller';
import { GetImportsQuery } from '../../application/queries/get-imports.query';
import { GroupMemberGuard } from '../../../../shared/infrastructure/guards/group-member.guard';

@Module({
  controllers: [ImportsController],
  providers: [GetImportsQuery, GroupMemberGuard],
})
export class ImportsModule {}
