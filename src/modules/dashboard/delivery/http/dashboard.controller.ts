import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/infrastructure/guards/jwt-auth.guard';
import { GroupMemberGuard } from '../../../../shared/infrastructure/guards/group-member.guard';
import { GetDashboardQuery } from '../../../expenses/application/queries/get-dashboard.query';
import { GetReconciliationQuery } from '../../../expenses/application/queries/get-reconciliation.query';
import { DashboardDto, ReconciliationItemDto } from '../../../expenses/application/dtos/app-responses.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GroupMemberGuard)
@Controller({ path: 'groups/:groupId', version: '1' })
export class DashboardController {
  constructor(
    private readonly getDashboard: GetDashboardQuery,
    private readonly getReconciliation: GetReconciliationQuery,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard summary for a group' })
  @ApiOkResponse()
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  async dashboard(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ): Promise<DashboardDto> {
    return this.getDashboard.execute({ groupId, month, year });
  }

  @Get('reconciliation')
  @ApiOperation({ summary: 'Get member balance reconciliation for a group' })
  @ApiOkResponse()
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  async reconciliation(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ): Promise<ReconciliationItemDto[]> {
    return this.getReconciliation.execute({ groupId, month, year });
  }
}
