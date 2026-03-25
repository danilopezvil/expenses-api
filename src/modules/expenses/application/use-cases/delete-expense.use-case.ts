import { Inject, Injectable } from '@nestjs/common';
import { EXPENSE_REPOSITORY, IExpenseRepository } from '../../domain/ports/expense-repository.port';
import { Result, err } from '../../../../shared/result/result';
import { DomainError, ForbiddenError } from '../../../../shared/errors/domain.errors';

@Injectable()
export class DeleteExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY) private readonly expenseRepository: IExpenseRepository,
  ) {}

  async execute(id: string, requestingUserId: string): Promise<Result<void, DomainError>> {
    const findResult = await this.expenseRepository.findById(id);
    if (findResult.isErr()) return findResult;

    const expense = findResult.value;

    if (expense.paidById !== requestingUserId) {
      return err(new ForbiddenError('Only the expense owner can delete it'));
    }

    return this.expenseRepository.delete(id);
  }
}
