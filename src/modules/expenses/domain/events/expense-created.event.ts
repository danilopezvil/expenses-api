import { DomainEvent } from '../../../../shared/domain/domain-event';

export class ExpenseCreatedEvent implements DomainEvent {
  readonly eventType = 'expense.created';
  readonly occurredAt = new Date();
  readonly payload: unknown;

  constructor(expense: {
    id: string;
    groupId: string;
    description: string;
    amount: { amount: number; currency: string };
    source: string;
  }) {
    this.payload = {
      expenseId: expense.id,
      groupId: expense.groupId,
      description: expense.description,
      amount: expense.amount.amount,
      currency: expense.amount.currency,
      source: expense.source,
    };
  }
}
