import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { GroupListItemDto } from '../dtos/groups-app.dto';

@Injectable()
export class GetGroupsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string): Promise<GroupListItemDto[]> {
    const memberships = await this.prisma.groupMembership.findMany({
      where: { userId, active: true },
      include: {
        group: {
          include: { _count: { select: { members: true } } },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      description: m.group.description ?? undefined,
      currency: m.group.currency,
      active: m.group.active,
      role: m.role,
      memberCount: m.group._count.members,
      joinedAt: m.joinedAt,
      createdAt: m.group.createdAt,
    }));
  }

  async executeOne(groupId: string): Promise<{ id: string; name: string; description?: string; currency: string; active: boolean; createdAt: Date } | null> {
    const g = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!g) return null;
    return {
      id: g.id,
      name: g.name,
      description: g.description ?? undefined,
      currency: g.currency,
      active: g.active,
      createdAt: g.createdAt,
    };
  }
}
