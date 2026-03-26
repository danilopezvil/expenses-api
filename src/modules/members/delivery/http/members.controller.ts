import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../shared/infrastructure/guards/jwt-auth.guard';
import { GroupMemberGuard } from '../../../../shared/infrastructure/guards/group-member.guard';
import { GetMembersQuery } from '../../application/queries/get-members.query';
import { CreateMemberUseCase } from '../../application/use-cases/create-member.use-case';
import { UpdateMemberUseCase } from '../../application/use-cases/update-member.use-case';
import { DeleteMemberUseCase } from '../../application/use-cases/delete-member.use-case';
import { CreateMemberHttpDto, UpdateMemberHttpDto } from './dtos/members-http.dto';

@ApiTags('members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GroupMemberGuard)
@Controller({ path: 'groups/:groupId/members', version: '1' })
export class MembersController {
  constructor(
    private readonly getMembers: GetMembersQuery,
    private readonly createMember: CreateMemberUseCase,
    private readonly updateMember: UpdateMemberUseCase,
    private readonly deleteMember: DeleteMemberUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List members of a group' })
  @ApiOkResponse()
  async findAll(@Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.getMembers.execute(groupId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a member to a group' })
  @ApiCreatedResponse()
  async create(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: CreateMemberHttpDto,
  ) {
    const result = await this.createMember.execute({ ...dto, groupId });
    if (result.isErr()) throw result.error;
    return result.value;
  }

  @Patch(':memberId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a member' })
  @ApiOkResponse()
  async update(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateMemberHttpDto,
  ) {
    const result = await this.updateMember.execute({ memberId, groupId, ...dto });
    if (result.isErr()) throw result.error;
    return result.value;
  }

  @Delete(':memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a member' })
  @ApiNoContentResponse()
  async remove(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ): Promise<void> {
    const result = await this.deleteMember.execute(memberId, groupId);
    if (result.isErr()) throw result.error;
  }
}
