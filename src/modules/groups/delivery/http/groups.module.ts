import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GetGroupsQuery } from '../../application/queries/get-groups.query';
import { CreateGroupUseCase } from '../../application/use-cases/create-group.use-case';
import { UpdateGroupUseCase } from '../../application/use-cases/update-group.use-case';
import { DeleteGroupUseCase } from '../../application/use-cases/delete-group.use-case';
import { GroupMemberGuard } from '../../../../shared/infrastructure/guards/group-member.guard';

@Module({
  controllers: [GroupsController],
  providers: [
    GetGroupsQuery,
    CreateGroupUseCase,
    UpdateGroupUseCase,
    DeleteGroupUseCase,
    GroupMemberGuard,
  ],
})
export class GroupsModule {}
