import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EXPENSE_REPOSITORY, IExpenseRepository } from '../../domain/ports/expense-repository.port';
import { Expense } from '../../domain/entities/expense.entity';
import { Money } from '../../domain/value-objects/money.vo';
import { ExpenseCategory } from '../../domain/value-objects/expense-category.vo';
import { ExpenseDomainService } from '../../domain/services/expense-domain.service';
import { CreateExpenseDto } from '../dtos/create-expense.dto';
import { ExpenseResponseDto } from '../dtos/expense-response.dto';
import { Result, ok, err } from '../../../../shared/result/result';
import { DomainError } from '../../../../shared/errors/domain.errors';

@Injectable()
export class CreateExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY) private readonly expenseRepository: IExpenseRepository,
    private readonly expenseDomainService: ExpenseDomainService,
  ) {}

  async execute(dto: CreateExpenseDto): Promise<Result<ExpenseResponseDto, DomainError>> {
    try {
      const money = Money.create(dto.amount, dto.currency);
      const category = dto.category
        ? ExpenseCategory.create(dto.category)
        : ExpenseCategory.other();

      const expense = Expense.create({
        id: randomUUID(),
        title: dto.title,
        description: dto.description,
        amount: money,
        category,
        paidById: dto.paidById,
        groupId: dto.groupId,
      });

      if (dto.splitBetween && dto.splitBetween.length > 0) {
        this.expenseDomainService.splitEqually(expense, dto.splitBetween);
      }

      const saveResult = await this.expenseRepository.save(expense);
      if (saveResult.isErr()) return saveResult;

      return ok(toResponseDto(saveResult.value));
    } catch (error) {
      if (error instanceof DomainError) return err(error);
      throw error;
    }
  }
}

export function toResponseDto(expense: Expense): ExpenseResponseDto {
  return {
    id: expense.id,
    title: expense.title,
    description: expense.description,
    amount: expense.amount.amount,
    currency: expense.amount.currency,
    category: expense.category.value,
    paidById: expense.paidById,
    groupId: expense.groupId,
    splits: expense.splits.map((s) => ({
      userId: s.userId,
      amount: s.amount.amount,
      currency: s.amount.currency,
      settled: s.settled,
    })),
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}
