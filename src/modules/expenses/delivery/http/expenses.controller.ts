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
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateExpenseUseCase } from '../../application/use-cases/create-expense.use-case';
import { AssignExpenseUseCase } from '../../application/use-cases/assign-expense.use-case';
import { GroupExpensesUseCase } from '../../application/use-cases/group-expenses.use-case';
import { PreviewImportUseCase } from '../../application/use-cases/preview-import.use-case';
import { ConfirmImportUseCase } from '../../application/use-cases/confirm-import.use-case';
import { UpdateExpenseUseCase } from '../../application/use-cases/update-expense.use-case';
import { DeleteExpenseUseCase } from '../../application/use-cases/delete-expense.use-case';
import { GetExpensesQuery } from '../../application/queries/get-expenses.query';
import { GetExpenseQuery } from '../../application/queries/get-expense.query';
import {
  ExpenseResponseDto,
  ExpenseListItemDto,
  PaginationMeta,
  PreviewImportResponseDto,
  ConfirmImportResultDto,
  GroupExpensesResultDto,
} from '../../application/dtos/app-responses.dto';
import { CreateExpenseHttpDto } from './dtos/create-expense.http-dto';
import { UpdateExpenseHttpDto } from './dtos/update-expense.http-dto';
import {
  AssignExpenseHttpDto,
  GroupExpensesHttpDto,
  PreviewImportHttpDto,
  ConfirmImportHttpDto,
} from './dtos/expenses-requests.http-dto';
import { JwtAuthGuard } from '../../../../shared/infrastructure/guards/jwt-auth.guard';
import { GroupMemberGuard } from '../../../../shared/infrastructure/guards/group-member.guard';
import { CurrentUser, CurrentUserPayload } from '../../../../shared/infrastructure/decorators/current-user.decorator';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, GroupMemberGuard)
@Controller({ path: 'groups/:groupId/expenses', version: '1' })
export class ExpensesController {
  constructor(
    private readonly createExpense: CreateExpenseUseCase,
    private readonly assignExpense: AssignExpenseUseCase,
    private readonly groupExpenses: GroupExpensesUseCase,
    private readonly previewImport: PreviewImportUseCase,
    private readonly confirmImport: ConfirmImportUseCase,
    private readonly updateExpense: UpdateExpenseUseCase,
    private readonly deleteExpense: DeleteExpenseUseCase,
    private readonly getExpensesQuery: GetExpensesQuery,
    private readonly getExpenseQuery: GetExpenseQuery,
  ) {}

  // ── Commands ────────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a manual expense' })
  @ApiCreatedResponse()
  async create(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: CreateExpenseHttpDto,
  ): Promise<ExpenseResponseDto> {
    const result = await this.createExpense.execute({ ...dto, groupId });
    if (result.isErr()) throw result.error;
    return result.value;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an expense' })
  @ApiOkResponse()
  async update(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseHttpDto,
  ): Promise<ExpenseResponseDto> {
    const result = await this.updateExpense.execute({ expenseId: id, groupId, ...dto });
    if (result.isErr()) throw result.error;
    return result.value;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Void an expense' })
  @ApiNoContentResponse()
  async remove(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    const result = await this.deleteExpense.execute(id, groupId);
    if (result.isErr()) throw result.error;
  }

  @Put(':id/assignments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Replace all assignments for an expense' })
  @ApiOkResponse()
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignExpenseHttpDto,
  ): Promise<ExpenseResponseDto> {
    const result = await this.assignExpense.execute({ expenseId: id, ...dto });
    if (result.isErr()) throw result.error;
    return result.value;
  }

  @Post('group')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Group multiple expenses into one' })
  @ApiOkResponse()
  async group(
    @Param('groupId', ParseUUIDPipe) _groupId: string,
    @Body() dto: GroupExpensesHttpDto,
  ): Promise<GroupExpensesResultDto> {
    const result = await this.groupExpenses.execute(dto);
    if (result.isErr()) throw result.error;
    return result.value;
  }

  @Post('import/preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview a text import without persisting' })
  @ApiOkResponse()
  async importPreview(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: PreviewImportHttpDto,
  ): Promise<PreviewImportResponseDto> {
    return this.previewImport.execute({ ...dto, groupId });
  }

  @Post('import/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm and persist a text import' })
  @ApiOkResponse()
  async importConfirm(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Body() dto: ConfirmImportHttpDto,
  ): Promise<ConfirmImportResultDto> {
    const result = await this.confirmImport.execute({ ...dto, groupId });
    if (result.isErr()) throw result.error;
    return result.value;
  }

  // ── Queries ─────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List expenses (paginated, filterable)' })
  @ApiOkResponse()
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'assigned', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('assigned') assigned?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ): Promise<{ data: ExpenseListItemDto[]; meta: PaginationMeta }> {
    return this.getExpensesQuery.execute({
      groupId,
      month,
      year,
      search,
      status: status as ExpenseListItemDto['status'] | undefined,
      assigned: assigned === 'true' ? true : assigned === 'false' ? false : undefined,
      page: Number(page),
      limit: Math.min(Number(limit), 100),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single expense' })
  @ApiOkResponse()
  async findOne(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExpenseResponseDto> {
    const expense = await this.getExpenseQuery.execute(id, groupId);
    if (!expense) throw new NotFoundException('Expense not found');
    return expense;
  }
}
