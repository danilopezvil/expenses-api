import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedRequest extends Request {
  user: { id: string };
  params: { groupId?: string } & Record<string, string>;
}

@Injectable()
export class GroupMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;
    const groupId = request.params['groupId'];

    if (!userId || !groupId) {
      throw new ForbiddenException('Access denied');
    }

    const member = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return true;
  }
}
