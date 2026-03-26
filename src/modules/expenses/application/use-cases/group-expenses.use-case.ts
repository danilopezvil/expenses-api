import { Injectable, Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { Result, ok, err } from '@shared/result/result';
import { DomainError, NotFoundError, ValidationError } from '@shared/errors/domain.errors';
import { Expense, ExpenseSource } from '../../domain/entities/expense.entity';
import { Assignment } from '../../domain/entities/assignment.entity';
import { Money } from '../../domain/value-objects/money.vo';
import { ExpenseGrouperService } from '../../domain/services/expense-grouper.service';
import { IExpenseRepository } from '../../domain/ports/expense-repository.port';
import { EXPENSE_REPOSITORY_PORT } from '../../domain/ports/injection-tokens';
import { GroupExpensesAppDto } from '../dtos/app-commands.dto';
import { GroupExpensesResultDto } from '../dtos/app-responses.dto';

@Injectable()
export class GroupExpensesUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepo: IExpenseRepository,
    private readonly grouperService: ExpenseGrouperService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(dto: GroupExpensesAppDto): Promise<Result<GroupExpensesResultDto, DomainError>> {
    // 1. Fetch all expenses
    const fetched = await Promise.all(dto.expenseIds.map((id) => this.expenseRepo.findById(id)));
    const expenses = fetched.filter((e): e is Expense => e !== null);
    if (expenses.length !== dto.expenseIds.length) {
      return err(new NotFoundError('One or more expenses not found'));
    }

    // 2. Run domain grouper — validates same groupId, ≥2, no VOIDED
    const groupResult = this.grouperService.group(expenses, dto.description);
    if (groupResult.isErr()) return groupResult;

    const { totalAmount, inheritedAssignments } = groupResult.value;

    // 3. Create new grouped expense
    let groupedMoney: Money;
    try {
      groupedMoney = Money.create(totalAmount.amount, totalAmount.currency);
    } catch (e) {
      return err(e instanceof DomainError ? e : new ValidationError(String(e)));
    }

    const newExpenseResult = Expense.create({
      id: randomUUID(),
      groupId: expenses[0].groupId,
      accountId: dto.accountId,
      description: dto.description,
      amount: groupedMoney,
      source: ExpenseSource.MANUAL,
      date: new Date(),
    });
    if (newExpenseResult.isErr()) return newExpenseResult;

    const newExpense = newExpenseResult.value;

    // 4. Inherit assignments if all originals were identical
    if (inheritedAssignments && inheritedAssignments.length > 0) {
      const newAssignments: Assignment[] = [];
      for (const a of inheritedAssignments) {
        const result = Assignment.create({
          id: randomUUID(),
          expenseId: newExpense.id,
          memberId: a.memberId,
          percentage: a.percentage,
        });
        if (result.isErr()) return result;
        newAssignments.push(result.value);
      }
      const assignResult = newExpense.assign(newAssignments);
      if (assignResult.isErr()) return assignResult;
    }

    // 5. Atomic: delete originals + save new (via repository transaction)
    await this.expenseRepo.replaceWithGrouped(dto.expenseIds, newExpense);

    // 6. Publish events
    for (const event of newExpense.pullDomainEvents()) this.eventBus.publish(event);

    return ok({ id: newExpense.id, amount: totalAmount.amount });
  }
}
