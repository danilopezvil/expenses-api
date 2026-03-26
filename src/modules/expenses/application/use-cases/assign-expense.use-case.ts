import { Injectable, Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { Result, ok, err } from '@shared/result/result';
import { DomainError, NotFoundError, ValidationError } from '@shared/errors/domain.errors';
import { Assignment } from '../../domain/entities/assignment.entity';
import { Percentage } from '../../domain/value-objects/percentage.vo';
import { IExpenseRepository } from '../../domain/ports/expense-repository.port';
import { EXPENSE_REPOSITORY_PORT } from '../../domain/ports/injection-tokens';
import { AssignExpenseAppDto } from '../dtos/app-commands.dto';
import { ExpenseResponseDto } from '../dtos/app-responses.dto';
import { ExpenseAppMapper } from '../mappers/expense-app.mapper';

@Injectable()
export class AssignExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_PORT)
    private readonly expenseRepo: IExpenseRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(dto: AssignExpenseAppDto): Promise<Result<ExpenseResponseDto, DomainError>> {
    // 1. Find expense
    const expense = await this.expenseRepo.findById(dto.expenseId);
    if (!expense) return err(new NotFoundError('Expense not found'));

    // 2. Build Assignment entities — Percentage.create may throw ValidationError
    const assignments: Assignment[] = [];
    for (const item of dto.assignments) {
      let percentage: Percentage;
      try {
        percentage = Percentage.create(item.percentage);
      } catch (e) {
        return err(e instanceof DomainError ? e : new ValidationError(String(e)));
      }

      const assignmentResult = Assignment.create({
        id: randomUUID(),
        expenseId: expense.id,
        memberId: item.memberId,
        percentage,
      });
      if (assignmentResult.isErr()) return assignmentResult;
      assignments.push(assignmentResult.value);
    }

    // 3. Assign (validates sum = 100)
    const assignResult = expense.assign(assignments);
    if (assignResult.isErr()) return assignResult;

    // 4. Persist
    await this.expenseRepo.save(expense);

    // 5. Publish domain events (includes ExpenseAssignedEvent)
    for (const event of expense.pullDomainEvents()) this.eventBus.publish(event);

    return ok(ExpenseAppMapper.toResponseDto(expense));
  }
}
