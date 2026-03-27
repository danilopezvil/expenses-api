import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  GroupMembershipRecord,
  IGroupMembershipRepository,
} from '../../domain/ports/group-membership-repository.port';

@Injectable()
export class PrismaGroupMembershipRepository implements IGroupMembershipRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByUserAndGroup(
    userId: string,
    groupId: string,
  ): Promise<GroupMembershipRecord | null> {
    const record = await this.prisma.groupMembership.findFirst({
      where: { userId, groupId, active: true },
    });
    if (!record) return null;
    return {
      id: record.id,
      userId: record.userId,
      groupId: record.groupId,
      role: record.role,
      active: record.active,
      joinedAt: record.joinedAt,
    };
  }
}
