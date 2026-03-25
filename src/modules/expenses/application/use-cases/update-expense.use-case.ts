import { Inject, Injectable } from '@nestjs/common';
import { EXPENSE_REPOSITORY, IExpenseRepository } from '../../domain/ports/expense-repository.port';
import { Money } from '../../domain/value-objects/money.vo';
import { ExpenseCategory, ExpenseCategoryEnum } from '../../domain/value-objects/expense-category.vo';
import { ExpenseResponseDto } from '../dtos/expense-response.dto';
import { Result, ok, err } from '../../../../shared/result/result';
import { DomainError, ForbiddenError } from '../../../../shared/errors/domain.errors';
import { toResponseDto } from './create-expense.use-case';

export interface UpdateExpenseDto {
  title?: string;
  description?: string;
  amount?: number;
  currency?: string;
  category?: ExpenseCategoryEnum;
}

@Injectable()
export class UpdateExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY) private readonly expenseRepository: IExpenseRepository,
  ) {}

  async execute(
    id: string,
    dto: UpdateExpenseDto,
    requestingUserId: string,
  ): Promise<Result<ExpenseResponseDto, DomainError>> {
    const findResult = await this.expenseRepository.findById(id);
    if (findResult.isErr()) return findResult;

    const expense = findResult.value;

    if (expense.paidById !== requestingUserId) {
      return err(new ForbiddenError('Only the expense owner can update it'));
    }

    try {
      expense.update({
        title: dto.title,
        description: dto.description,
        amount:
          dto.amount !== undefined
            ? Money.create(dto.amount, dto.currency ?? expense.amount.currency)
            : undefined,
        category: dto.category ? ExpenseCategory.create(dto.category) : undefined,
      });
    } catch (error) {
      if (error instanceof DomainError) return err(error);
      throw error;
    }

    const updateResult = await this.expenseRepository.update(expense);
    if (updateResult.isErr()) return updateResult;

    return ok(toResponseDto(updateResult.value));
  }
}
