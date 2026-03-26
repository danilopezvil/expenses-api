import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
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
import { CurrentUser, CurrentUserPayload } from '../../../../shared/infrastructure/decorators/current-user.decorator';
import { GetGroupsQuery } from '../../application/queries/get-groups.query';
import { CreateGroupUseCase } from '../../application/use-cases/create-group.use-case';
import { UpdateGroupUseCase } from '../../application/use-cases/update-group.use-case';
import { DeleteGroupUseCase } from '../../application/use-cases/delete-group.use-case';
import { CreateGroupHttpDto, UpdateGroupHttpDto } from './dtos/groups-http.dto';

@ApiTags('groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'groups', version: '1' })
export class GroupsController {
  constructor(
    private readonly getGroups: GetGroupsQuery,
    private readonly createGroup: CreateGroupUseCase,
    private readonly updateGroup: UpdateGroupUseCase,
    private readonly deleteGroup: DeleteGroupUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List my groups' })
  @ApiOkResponse()
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.getGroups.execute(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new group' })
  @ApiCreatedResponse()
  async create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateGroupHttpDto) {
    const result = await this.createGroup.execute({ ...dto, userId: user.id });
    if (result.isErr()) throw result.error;
    return result.value;
  }

  @Get(':groupId')
  @UseGuards(GroupMemberGuard)
  @ApiOperation({ summary: 'Get a group by ID' })
  @ApiOkResponse()
  async findOne(@Param('groupId', ParseUUIDPipe) groupId: string) {
    const group = await this.getGroups.executeOne(groupId);
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  @Patch(':groupId')
  @UseGuards(GroupMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a group' })
  @ApiOkResponse()
  async update(@Param('groupId', ParseUUIDPipe) groupId: string, @Body() dto: UpdateGroupHttpDto) {
    const result = await this.updateGroup.execute({ groupId, ...dto });
    if (result.isErr()) throw result.error;
    return result.value;
  }

  @Delete(':groupId')
  @UseGuards(GroupMemberGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a group' })
  @ApiNoContentResponse()
  async remove(@Param('groupId', ParseUUIDPipe) groupId: string): Promise<void> {
    const result = await this.deleteGroup.execute(groupId);
    if (result.isErr()) throw result.error;
  }
}
