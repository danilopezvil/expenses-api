import { Injectable, Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { Result, ok, err } from '@shared/result/result';
import { DomainError, NotFoundError, ValidationError } from '@shared/errors/domain.errors';
import { Expense, ExpenseSource } from '../../domain/entities/expense.entity';
import { Money } from '../../domain/value-objects/money.vo';
import { IExpenseRepository } from '../../domain/ports/expense-repository.port';
import { IAccountRepository } from '../../domain/ports/account-repository.port';
import { EXPENSE_REPOSITORY_PORT, ACCOUNT_REPOSITORY_PORT } from '../../domain/ports/injection-tokens';
import { CreateExpenseAppDto } from '../dtos/app-commands.dto';
import { ExpenseResponseDto } from '../dtos/app-responses.dto';
import { ExpenseAppMapper } from '../mappers/expense-app.mapper';

@Injectable()
export class CreateExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepo: IExpenseRepository,
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepo: IAccountRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(dto: CreateExpenseAppDto): Promise<Result<ExpenseResponseDto, DomainError>> {
    // 1. Validate account belongs to the group
    if (dto.accountId) {
      const account = await this.accountRepo.findById(dto.accountId);
      if (!account) return err(new NotFoundError('Account not found'));
      if (account.groupId !== dto.groupId) {
        return err(new ValidationError('Account does not belong to the specified group'));
      }
    }

    // 2. Build Money VO (may throw MoneyValidationError)
    let money: Money;
    try {
      money = Money.create(dto.amount, dto.currency ?? 'USD');
    } catch (e) {
      return err(e instanceof DomainError ? e : new ValidationError(String(e)));
    }

    // 3. Create domain entity
    const expenseResult = Expense.create({
      id: randomUUID(),
      groupId: dto.groupId,
      accountId: dto.accountId,
      description: dto.description,
      amount: money,
      source: dto.source ?? ExpenseSource.MANUAL,
      date: dto.date instanceof Date ? dto.date : new Date(dto.date),
    });
    if (expenseResult.isErr()) return expenseResult;

    const expense = expenseResult.value;

    // 4. Persist
    await this.expenseRepo.save(expense);

    // 5. Publish domain events
    for (const event of expense.pullDomainEvents()) this.eventBus.publish(event);

    return ok(ExpenseAppMapper.toResponseDto(expense));
  }
}
