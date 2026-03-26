import { Injectable, Inject } from '@nestjs/common';
import { Result, ok, err } from '@shared/result/result';
import { DomainError, NotFoundError } from '@shared/errors/domain.errors';
import { IExpenseRepository } from '../../domain/ports/expense-repository.port';
import { EXPENSE_REPOSITORY_PORT } from '../../domain/ports/injection-tokens';

@Injectable()
export class DeleteExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepo: IExpenseRepository,
  ) {}

  async execute(expenseId: string, groupId: string): Promise<Result<void, DomainError>> {
    const expense = await this.expenseRepo.findById(expenseId);
    if (!expense) return err(new NotFoundError('Expense not found'));
    if (expense.groupId !== groupId) return err(new NotFoundError('Expense not found'));

    const voidResult = expense.void();
    if (voidResult.isErr()) return voidResult;

    await this.expenseRepo.save(expense);
    return ok(undefined);
  }
}
