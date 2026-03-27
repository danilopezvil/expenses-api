import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AuditAction } from '@prisma/client';
import { ExpenseImportedEvent } from '../../domain/events/expense-imported.event';
import { AuditService } from '../../../../shared/infrastructure/audit/audit.service';

interface ExpenseImportedPayload {
  count: number;
  groupId: string;
  expenseIds: string[];
  hashes: string[];
}

@EventsHandler(ExpenseImportedEvent)
export class ExpenseImportedHandler implements IEventHandler<ExpenseImportedEvent> {
  constructor(private readonly audit: AuditService) {}

  async handle(event: ExpenseImportedEvent): Promise<void> {
    const payload = event.payload as ExpenseImportedPayload;
    await this.audit.log({
      action: AuditAction.IMPORT,
      entityType: 'expense',
      entityId: payload.groupId,
      after: {
        count: payload.count,
        expenseIds: payload.expenseIds,
      },
    });
  }
}
