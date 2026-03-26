import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { MemberDto } from '../dtos/members-app.dto';

@Injectable()
export class GetMembersQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(groupId: string): Promise<MemberDto[]> {
    const members = await this.prisma.member.findMany({
      where: { groupId, active: true },
      orderBy: { name: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      groupId: m.groupId,
      userId: m.userId ?? undefined,
      name: m.name,
      color: m.color,
      active: m.active,
      createdAt: m.createdAt,
    }));
  }
}
