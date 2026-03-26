import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { GetDashboardQuery } from '../../../expenses/application/queries/get-dashboard.query';
import { GetReconciliationQuery } from '../../../expenses/application/queries/get-reconciliation.query';
import { GroupMemberGuard } from '../../../../shared/infrastructure/guards/group-member.guard';

@Module({
  controllers: [DashboardController],
  providers: [GetDashboardQuery, GetReconciliationQuery, GroupMemberGuard],
})
export class DashboardModule {}
