import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { GetAccountsQuery } from '../../application/queries/get-accounts.query';
import { CreateAccountUseCase } from '../../application/use-cases/create-account.use-case';
import { UpdateAccountUseCase } from '../../application/use-cases/update-account.use-case';
import { DeleteAccountUseCase } from '../../application/use-cases/delete-account.use-case';
import { GroupMemberGuard } from '../../../../shared/infrastructure/guards/group-member.guard';

@Module({
  controllers: [AccountsController],
  providers: [
    GetAccountsQuery,
    CreateAccountUseCase,
    UpdateAccountUseCase,
    DeleteAccountUseCase,
    GroupMemberGuard,
  ],
})
export class AccountsModule {}
