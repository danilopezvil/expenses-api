import { Injectable, Inject } from '@nestjs/common';
import { Result, ok, err } from '@shared/result/result';
import { DomainError, NotFoundError, ValidationError } from '@shared/errors/domain.errors';
import { Expense } from '../../domain/entities/expense.entity';
import { Money } from '../../domain/value-objects/money.vo';
import { IExpenseRepository } from '../../domain/ports/expense-repository.port';
import { EXPENSE_REPOSITORY_PORT } from '../../domain/ports/injection-tokens';
import { ExpenseResponseDto } from '../dtos/app-responses.dto';
import { ExpenseAppMapper } from '../mappers/expense-app.mapper';

export interface UpdateExpenseAppDto {
  expenseId: string;
  groupId: string;
  description?: string;
  amount?: number;
  currency?: string;
  accountId?: string | null;
  categoryId?: string | null;
  date?: string | Date;
}

@Injectable()
export class UpdateExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepo: IExpenseRepository,
  ) {}

  async execute(dto: UpdateExpenseAppDto): Promise<Result<ExpenseResponseDto, DomainError>> {
    const expense = await this.expenseRepo.findById(dto.expenseId);
    if (!expense) return err(new NotFoundError('Expense not found'));
    if (expense.groupId !== dto.groupId) return err(new NotFoundError('Expense not found'));

    let amount = expense.amount;
    if (dto.amount !== undefined) {
      try {
        amount = Money.create(dto.amount, dto.currency ?? expense.amount.currency);
      } catch (e) {
        return err(e instanceof DomainError ? e : new ValidationError(String(e)));
      }
    }

    const newDate = dto.date ? (dto.date instanceof Date ? dto.date : new Date(dto.date)) : expense.date;
    const newMonth = dto.date ? String(newDate.getMonth() + 1).padStart(2, '0') : expense.month;
    const newYear = dto.date ? String(newDate.getFullYear()) : expense.year;

    const updated = Expense.reconstitute({
      id: expense.id,
      groupId: expense.groupId,
      accountId: dto.accountId !== undefined ? (dto.accountId ?? undefined) : expense.accountId,
      categoryId: dto.categoryId !== undefined ? (dto.categoryId ?? undefined) : expense.categoryId,
      description: dto.description ?? expense.description,
      amount,
      source: expense.source,
      status: expense.status,
      importHash: expense.importHash,
      date: newDate,
      month: newMonth,
      year: newYear,
      assignments: expense.assignments,
      createdAt: expense.createdAt,
      updatedAt: new Date(),
    });

    await this.expenseRepo.save(updated);
    return ok(ExpenseAppMapper.toResponseDto(updated));
  }
}
