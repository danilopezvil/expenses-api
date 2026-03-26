import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/infrastructure/guards/jwt-auth.guard';
import { GroupMemberGuard } from '../../../../shared/infrastructure/guards/group-member.guard';
import { GetExportsQuery } from '../../application/queries/get-exports.query';
import { CreateExportUseCase } from '../../application/use-cases/create-export.use-case';
import { CreateExportHttpDto } from './dtos/exports-http.dto';

@ApiTags('exports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GroupMemberGuard)
@Controller({ path: 'groups/:groupId/exports', version: '1' })
export class ExportsController {
  constructor(
    private readonly getExports: GetExportsQuery,
    private readonly createExport: CreateExportUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List export history for a group' })
  @ApiOkResponse()
  async findAll(@Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.getExports.execute(groupId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an export' })
  @ApiCreatedResponse()
  async create(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: CreateExportHttpDto,
  ) {
    const result = await this.createExport.execute({ groupId, filters: dto });
    if (result.isErr()) throw result.error;
    return result.value;
  }
}
