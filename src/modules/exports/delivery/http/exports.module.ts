import { Module } from '@nestjs/common';
import { ExportsController } from './exports.controller';
import { GetExportsQuery } from '../../application/queries/get-exports.query';
import { CreateExportUseCase } from '../../application/use-cases/create-export.use-case';
import { GroupMemberGuard } from '../../../../shared/infrastructure/guards/group-member.guard';

@Module({
  controllers: [ExportsController],
  providers: [GetExportsQuery, CreateExportUseCase, GroupMemberGuard],
})
export class ExportsModule {}
