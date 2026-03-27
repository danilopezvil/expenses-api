import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { GroupMembershipRecord } from '../../domain/ports/group-membership-repository.port';

interface RequestWithMembership extends Request {
  groupMembership?: GroupMembershipRecord;
}

export const GroupMembership = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): GroupMembershipRecord => {
    const request = ctx.switchToHttp().getRequest<RequestWithMembership>();
    return request.groupMembership as GroupMembershipRecord;
  },
);
