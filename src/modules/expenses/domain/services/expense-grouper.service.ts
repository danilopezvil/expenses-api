import { Expense, ExpenseStatus } from '../entities/expense.entity';
import { Assignment } from '../entities/assignment.entity';
import { Money } from '../value-objects/money.vo';
import { Result, ok, err } from '../../../../shared/result/result';
import { DomainError, ValidationError } from '../../../../shared/errors/domain.errors';

export interface GroupResult {
  totalAmount: Money;
  inheritedAssignments: Assignment[] | null;
}

export class ExpenseGrouperService {
  group(expenses: Expense[], _newDescription: string): Result<GroupResult, DomainError> {
    if (expenses.length < 2) {
      return err(new ValidationError('At least 2 expenses are required to group'));
    }

    const firstGroupId = expenses[0].groupId;
    if (!expenses.every((e) => e.groupId === firstGroupId)) {
      return err(new ValidationError('All expenses must belong to the same group'));
    }

    if (expenses.some((e) => e.status === ExpenseStatus.VOIDED)) {
      return err(new ValidationError('Cannot group voided expenses'));
    }

    const currency = expenses[0].amount.currency;
    const totalAmount = expenses.reduce(
      (sum, e) => sum.add(e.amount),
      Money.create(0, currency),
    );

    const inheritedAssignments = this.resolveSharedAssignments(expenses);

    return ok({ totalAmount, inheritedAssignments });
  }

  private resolveSharedAssignments(expenses: Expense[]): Assignment[] | null {
    const reference = expenses[0].assignments;
    if (reference.length === 0) return null;

    for (const expense of expenses.slice(1)) {
      if (!this.assignmentsMatch(reference, expense.assignments)) return null;
    }

    return reference;
  }

  private assignmentsMatch(a: Assignment[], b: Assignment[]): boolean {
    if (a.length !== b.length) return false;
    const sort = (arr: Assignment[]) =>
      [...arr].sort((x, y) => x.memberId.localeCompare(y.memberId));
    return sort(a).every(
      (x, i) =>
        x.memberId === sort(b)[i].memberId &&
        x.percentage.value === sort(b)[i].percentage.value,
    );
  }
}
