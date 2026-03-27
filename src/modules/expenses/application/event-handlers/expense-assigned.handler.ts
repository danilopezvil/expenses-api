import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AuditAction } from '@prisma/client';
import { ExpenseAssignedEvent } from '../../domain/events/expense-assigned.event';
import { AuditService } from '../../../../shared/infrastructure/audit/audit.service';

interface ExpenseAssignedPayload {
  expenseId: string;
  groupId: string;
  assignments: Array<{ memberId: string; percentage: number }>;
}

@EventsHandler(ExpenseAssignedEvent)
export class ExpenseAssignedHandler implements IEventHandler<ExpenseAssignedEvent> {
  constructor(private readonly audit: AuditService) {}

  async handle(event: ExpenseAssignedEvent): Promise<void> {
    const payload = event.payload as ExpenseAssignedPayload;
    await this.audit.log({
      action: AuditAction.UPDATE,
      entityType: 'expense',
      entityId: payload.expenseId,
      after: { assignments: payload.assignments },
    });
  }
}
