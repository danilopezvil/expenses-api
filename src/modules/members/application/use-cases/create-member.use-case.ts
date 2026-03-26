import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { Result, ok, err } from '@shared/result/result';
import { ConflictError } from '@shared/errors/domain.errors';
import { CreateMemberAppDto, MemberDto } from '../dtos/members-app.dto';

@Injectable()
export class CreateMemberUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: CreateMemberAppDto): Promise<Result<MemberDto, ConflictError>> {
    const existing = await this.prisma.member.findUnique({
      where: { groupId_name: { groupId: dto.groupId, name: dto.name } },
    });
    if (existing) return err(new ConflictError(`Member "${dto.name}" already exists in this group`));

    const member = await this.prisma.member.create({
      data: {
        id: randomUUID(),
        groupId: dto.groupId,
        name: dto.name,
        color: dto.color ?? '#6366f1',
        userId: dto.userId,
      },
    });

    return ok({
      id: member.id,
      groupId: member.groupId,
      userId: member.userId ?? undefined,
      name: member.name,
      color: member.color,
      active: member.active,
      createdAt: member.createdAt,
    });
  }
}
