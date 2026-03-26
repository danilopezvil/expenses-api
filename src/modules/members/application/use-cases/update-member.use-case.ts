import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { Result, ok, err } from '@shared/result/result';
import { NotFoundError } from '@shared/errors/domain.errors';
import { UpdateMemberAppDto, MemberDto } from '../dtos/members-app.dto';

@Injectable()
export class UpdateMemberUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: UpdateMemberAppDto): Promise<Result<MemberDto, NotFoundError>> {
    const existing = await this.prisma.member.findFirst({
      where: { id: dto.memberId, groupId: dto.groupId },
    });
    if (!existing) return err(new NotFoundError('Member not found'));

    const member = await this.prisma.member.update({
      where: { id: dto.memberId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.color !== undefined && { color: dto.color }),
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
