import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
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
import { GetExpensesQuery } from '../../application/queries/get-expenses.query';
import { GetDashboardQuery } from '../../application/queries/get-dashboard.query';
import { GetReconciliationQuery } from '../../application/queries/get-reconciliation.query';
import {
  ExpenseResponseDto,
  ExpenseListItemDto,
  PaginationMeta,
  PreviewImportResponseDto,
  ConfirmImportResultDto,
  GroupExpensesResultDto,
  DashboardDto,
  ReconciliationItemDto,
} from '../../application/dtos/app-responses.dto';
import { CreateExpenseHttpDto } from './dtos/create-expense.http-dto';
import {
  AssignExpenseHttpDto,
  GroupExpensesHttpDto,
  PreviewImportHttpDto,
  ConfirmImportHttpDto,
} from './dtos/expenses-requests.http-dto';
import { JwtAuthGuard } from '../../../../shared/infrastructure/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../../../shared/infrastructure/decorators/current-user.decorator';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'expenses', version: '1' })
export class ExpensesController {
  constructor(
    private readonly createExpenseUseCase: CreateExpenseUseCase,
    private readonly assignExpenseUseCase: AssignExpenseUseCase,
    private readonly groupExpensesUseCase: GroupExpensesUseCase,
    private readonly previewImportUseCase: PreviewImportUseCase,
    private readonly confirmImportUseCase: ConfirmImportUseCase,
    private readonly getExpensesQuery: GetExpensesQuery,
    private readonly getDashboardQuery: GetDashboardQuery,
    private readonly getReconciliationQuery: GetReconciliationQuery,
  ) {}

  // ── Commands ────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a manual expense' })
  @ApiCreatedResponse()
  async create(
    @Body() dto: CreateExpenseHttpDto,
  ): Promise<ExpenseResponseDto> {
    const result = await this.createExpenseUseCase.execute(dto);
    if (result.isErr()) throw result.error;
    return result.value;
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign expense to group members' })
  @ApiOkResponse()
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignExpenseHttpDto,
  ): Promise<ExpenseResponseDto> {
    const result = await this.assignExpenseUseCase.execute({ expenseId: id, ...dto });
    if (result.isErr()) throw result.error;
    return result.value;
  }

  @Post('group')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Group multiple expenses into one' })
  @ApiOkResponse()
  async group(@Body() dto: GroupExpensesHttpDto): Promise<GroupExpensesResultDto> {
    const result = await this.groupExpensesUseCase.execute(dto);
    if (result.isErr()) throw result.error;
    return result.value;
  }

  @Post('import/preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview a text import without persisting' })
  @ApiOkResponse()
  async previewImport(@Body() dto: PreviewImportHttpDto): Promise<PreviewImportResponseDto> {
    return this.previewImportUseCase.execute(dto);
  }

  @Post('import/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm and persist a text import' })
  @ApiOkResponse()
  async confirmImport(@Body() dto: ConfirmImportHttpDto): Promise<ConfirmImportResultDto> {
    const result = await this.confirmImportUseCase.execute(dto);
    if (result.isErr()) throw result.error;
    return result.value;
  }

  // ── Queries ─────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List expenses (paginated, filterable)' })
  @ApiOkResponse()
  @ApiQuery({ name: 'groupId', required: true, type: String })
  @ApiQuery({ name: 'month', required: false, type: String })
  @ApiQuery({ name: 'year', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'assigned', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('groupId') groupId: string,
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

  @Get('dashboard')
  @ApiOperation({ summary: 'Get expense dashboard summary' })
  @ApiOkResponse()
  @ApiQuery({ name: 'groupId', required: true, type: String })
  @ApiQuery({ name: 'month', required: false, type: String })
  @ApiQuery({ name: 'year', required: false, type: String })
  async dashboard(
    @Query('groupId') groupId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ): Promise<DashboardDto> {
    return this.getDashboardQuery.execute({ groupId, month, year });
  }

  @Get('reconciliation')
  @ApiOperation({ summary: 'Get reconciliation balance per member' })
  @ApiOkResponse()
  @ApiQuery({ name: 'groupId', required: true, type: String })
  @ApiQuery({ name: 'month', required: false, type: String })
  @ApiQuery({ name: 'year', required: false, type: String })
  async reconciliation(
    @Query('groupId') groupId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ): Promise<ReconciliationItemDto[]> {
    return this.getReconciliationQuery.execute({ groupId, month, year });
  }
}
