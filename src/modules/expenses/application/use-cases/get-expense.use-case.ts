import { Inject, Injectable } from '@nestjs/common';
import { EXPENSE_REPOSITORY, IExpenseRepository } from '../../domain/ports/expense-repository.port';
import { ExpenseResponseDto } from '../dtos/expense-response.dto';
import { Result, ok } from '../../../../shared/result/result';
import { DomainError } from '../../../../shared/errors/domain.errors';
import { toResponseDto } from './create-expense.use-case';

@Injectable()
export class GetExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY) private readonly expenseRepository: IExpenseRepository,
  ) {}

  async execute(id: string): Promise<Result<ExpenseResponseDto, DomainError>> {
    const result = await this.expenseRepository.findById(id);
    if (result.isErr()) return result;
    return ok(toResponseDto(result.value));
  }
}
