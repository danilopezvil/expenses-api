import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { GetMembersQuery } from '../../application/queries/get-members.query';
import { CreateMemberUseCase } from '../../application/use-cases/create-member.use-case';
import { UpdateMemberUseCase } from '../../application/use-cases/update-member.use-case';
import { DeleteMemberUseCase } from '../../application/use-cases/delete-member.use-case';
import { GroupMemberGuard } from '../../../../shared/infrastructure/guards/group-member.guard';

@Module({
  controllers: [MembersController],
  providers: [
    GetMembersQuery,
    CreateMemberUseCase,
    UpdateMemberUseCase,
    DeleteMemberUseCase,
    GroupMemberGuard,
  ],
})
export class MembersModule {}
