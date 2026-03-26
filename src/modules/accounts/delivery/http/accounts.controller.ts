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
import { GetAccountsQuery } from '../../application/queries/get-accounts.query';
import { CreateAccountUseCase } from '../../application/use-cases/create-account.use-case';
import { UpdateAccountUseCase } from '../../application/use-cases/update-account.use-case';
import { DeleteAccountUseCase } from '../../application/use-cases/delete-account.use-case';
import { CreateAccountHttpDto, UpdateAccountHttpDto } from './dtos/accounts-http.dto';

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GroupMemberGuard)
@Controller({ path: 'groups/:groupId/accounts', version: '1' })
export class AccountsController {
  constructor(
    private readonly getAccounts: GetAccountsQuery,
    private readonly createAccount: CreateAccountUseCase,
    private readonly updateAccount: UpdateAccountUseCase,
    private readonly deleteAccount: DeleteAccountUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List accounts for a group' })
  @ApiOkResponse()
  async findAll(@Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.getAccounts.execute(groupId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an account' })
  @ApiCreatedResponse()
  async create(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: CreateAccountHttpDto,
  ) {
    const result = await this.createAccount.execute({ ...dto, groupId });
    if (result.isErr()) throw result.error;
    return result.value;
  }

  @Patch(':accountId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an account' })
  @ApiOkResponse()
  async update(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Body() dto: UpdateAccountHttpDto,
  ) {
    const result = await this.updateAccount.execute({ accountId, groupId, ...dto });
    if (result.isErr()) throw result.error;
    return result.value;
  }

  @Delete(':accountId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate an account' })
  @ApiNoContentResponse()
  async remove(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('accountId', ParseUUIDPipe) accountId: string,
  ): Promise<void> {
    const result = await this.deleteAccount.execute(accountId, groupId);
    if (result.isErr()) throw result.error;
  }
}
