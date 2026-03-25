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
import { GetExpenseUseCase } from '../../application/use-cases/get-expense.use-case';
import { UpdateExpenseUseCase } from '../../application/use-cases/update-expense.use-case';
import { DeleteExpenseUseCase } from '../../application/use-cases/delete-expense.use-case';
import { ListExpensesQuery } from '../../application/queries/list-expenses.query';
import { CreateExpenseHttpDto } from './dtos/create-expense.http-dto';
import { UpdateExpenseHttpDto } from './dtos/update-expense.http-dto';
import {
  ExpenseResponseHttpDto,
  PaginatedExpenseResponseDto,
} from './dtos/expense-response.http-dto';
import { JwtAuthGuard } from '../../../../shared/infrastructure/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../../../shared/infrastructure/decorators/current-user.decorator';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'expenses', version: '1' })
export class ExpensesController {
  constructor(
    private readonly createExpenseUseCase: CreateExpenseUseCase,
    private readonly getExpenseUseCase: GetExpenseUseCase,
    private readonly updateExpenseUseCase: UpdateExpenseUseCase,
    private readonly deleteExpenseUseCase: DeleteExpenseUseCase,
    private readonly listExpensesQuery: ListExpensesQuery,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new expense' })
  @ApiCreatedResponse({ type: ExpenseResponseHttpDto })
  async create(
    @Body() dto: CreateExpenseHttpDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ExpenseResponseHttpDto> {
    const result = await this.createExpenseUseCase.execute({
      ...dto,
      paidById: dto.paidById ?? user.id,
    });
    if (result.isErr()) throw result.error;
    return result.value as ExpenseResponseHttpDto;
  }

  @Get()
  @ApiOperation({ summary: 'List expenses (paginated)' })
  @ApiOkResponse({ type: PaginatedExpenseResponseDto })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'groupId', required: false, type: String })
  @ApiQuery({ name: 'currency', required: false, type: String })
  @ApiQuery({ name: 'paidById', required: false, type: String })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('groupId') groupId?: string,
    @Query('currency') currency?: string,
    @Query('paidById') paidById?: string,
  ): Promise<PaginatedExpenseResponseDto> {
    return this.listExpensesQuery.execute(
      { groupId, currency, paidById },
      { page: Number(page), limit: Math.min(Number(limit), 100) },
    ) as Promise<PaginatedExpenseResponseDto>;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single expense by ID' })
  @ApiOkResponse({ type: ExpenseResponseHttpDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExpenseResponseHttpDto> {
    const result = await this.getExpenseUseCase.execute(id);
    if (result.isErr()) throw result.error;
    return result.value as ExpenseResponseHttpDto;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense (owner only)' })
  @ApiOkResponse({ type: ExpenseResponseHttpDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseHttpDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ExpenseResponseHttpDto> {
    const result = await this.updateExpenseUseCase.execute(id, dto, user.id);
    if (result.isErr()) throw result.error;
    return result.value as ExpenseResponseHttpDto;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an expense (owner only)' })
  @ApiNoContentResponse()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<void> {
    const result = await this.deleteExpenseUseCase.execute(id, user.id);
    if (result.isErr()) throw result.error;
  }
}
