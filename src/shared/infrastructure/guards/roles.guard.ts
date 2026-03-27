import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { GroupMembershipRecord, GroupRole } from '../../domain/ports/group-membership-repository.port';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface RequestWithMembership extends Request {
  groupMembership?: GroupMembershipRecord;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<GroupRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<RequestWithMembership>();
    const role = request.groupMembership?.role;

    return role !== undefined && requiredRoles.includes(role);
  }
}
