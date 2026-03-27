import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AuditAction } from '@prisma/client';
import { UserLoggedInEvent } from '../../domain/events/user-logged-in.event';
import { AuditService } from '../../../../shared/infrastructure/audit/audit.service';

interface UserLoggedInPayload {
  userId: string;
  ipAddress?: string;
}

@EventsHandler(UserLoggedInEvent)
export class UserLoggedInHandler implements IEventHandler<UserLoggedInEvent> {
  constructor(private readonly audit: AuditService) {}

  async handle(event: UserLoggedInEvent): Promise<void> {
    const payload = event.payload as UserLoggedInPayload;
    await this.audit.log({
      userId: payload.userId,
      action: AuditAction.LOGIN,
      entityType: 'user',
      entityId: payload.userId,
      ipAddress: payload.ipAddress,
    });
  }
}
