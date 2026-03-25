import { DomainEvent } from '../../../../shared/domain/domain-event';

export class ExpenseImportedEvent implements DomainEvent {
  readonly eventType = 'expense.imported';
  readonly occurredAt = new Date();
  readonly payload: unknown;

  constructor(expenses: Array<{ id: string; groupId: string; importHash: { value: string } }>) {
    this.payload = {
      count: expenses.length,
      groupId: expenses[0]?.groupId,
      expenseIds: expenses.map((e) => e.id),
      hashes: expenses.map((e) => e.importHash.value),
    };
  }
}
