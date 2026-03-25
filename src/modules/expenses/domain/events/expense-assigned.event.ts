import { DomainEvent } from '../../../../shared/domain/domain-event';
import { Assignment } from '../entities/assignment.entity';

export class ExpenseAssignedEvent implements DomainEvent {
  readonly eventType = 'expense.assigned';
  readonly occurredAt = new Date();
  readonly payload: unknown;

  constructor(
    expense: { id: string; groupId: string },
    assignments: Assignment[],
  ) {
    this.payload = {
      expenseId: expense.id,
      groupId: expense.groupId,
      assignments: assignments.map((a) => ({
        memberId: a.memberId,
        percentage: a.percentage.value,
      })),
    };
  }
}
