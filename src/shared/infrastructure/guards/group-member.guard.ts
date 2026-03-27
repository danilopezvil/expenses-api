import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import {
  GROUP_MEMBERSHIP_REPOSITORY_PORT,
  GroupMembershipRecord,
  IGroupMembershipRepository,
} from '../../domain/ports/group-membership-repository.port';

interface AuthenticatedRequest extends Request {
  user: { id: string };
  params: { groupId?: string } & Record<string, string>;
  groupMembership?: GroupMembershipRecord;
}

@Injectable()
export class GroupMemberGuard implements CanActivate {
  constructor(
    @Inject(GROUP_MEMBERSHIP_REPOSITORY_PORT)
    private readonly membershipRepo: IGroupMembershipRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;
    const groupId = request.params['groupId'];

    if (!userId || !groupId) throw new ForbiddenException();

    const membership = await this.membershipRepo.findActiveByUserAndGroup(userId, groupId);
    if (!membership) throw new ForbiddenException('Not a member of this group');

    request.groupMembership = membership;
    return true;
  }
}
