import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/infrastructure/guards/jwt-auth.guard';
import { GroupMemberGuard } from '../../../../shared/infrastructure/guards/group-member.guard';
import { GetImportsQuery } from '../../application/queries/get-imports.query';

@ApiTags('imports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GroupMemberGuard)
@Controller({ path: 'groups/:groupId/imports', version: '1' })
export class ImportsController {
  constructor(private readonly getImports: GetImportsQuery) {}

  @Get()
  @ApiOperation({ summary: 'List import history for a group' })
  @ApiOkResponse()
  async findAll(@Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.getImports.execute(groupId);
  }
}
