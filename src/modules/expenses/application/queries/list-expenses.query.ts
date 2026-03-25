import { Inject, Injectable } from '@nestjs/common';
import {
  EXPENSE_REPOSITORY,
  IExpenseRepository,
  ExpenseFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/ports/expense-repository.port';
import { ExpenseResponseDto } from '../dtos/expense-response.dto';
import { toResponseDto } from '../use-cases/create-expense.use-case';

@Injectable()
export class ListExpensesQuery {
  constructor(
    @Inject(EXPENSE_REPOSITORY) private readonly expenseRepository: IExpenseRepository,
  ) {}

  async execute(
    filters: ExpenseFilters,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<ExpenseResponseDto>> {
    const result = await this.expenseRepository.findAll(filters, pagination);

    return {
      ...result,
      items: result.items.map(toResponseDto),
    };
  }
}
