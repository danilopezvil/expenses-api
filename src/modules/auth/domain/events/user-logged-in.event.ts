import { DomainEvent } from '../../../../shared/domain/domain-event';

export class UserLoggedInEvent implements DomainEvent {
  readonly eventType = 'auth.user_logged_in';
  readonly occurredAt = new Date();
  readonly payload: unknown;

  constructor(userId: string, ipAddress?: string) {
    this.payload = { userId, ipAddress };
  }
}
