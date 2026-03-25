import { DomainEvent } from '../../../../shared/domain/domain-event';

export class ExpenseUpdatedEvent implements DomainEvent {
  readonly eventType = 'expense.updated';
  readonly occurredAt = new Date();
  readonly payload: unknown;

  constructor(expense: { id: string; updatedAt: Date }) {
    this.payload = {
      expenseId: expense.id,
      updatedAt: expense.updatedAt,
    };
  }
}
