import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { Result, ok, err } from '@shared/result/result';
import { NotFoundError } from '@shared/errors/domain.errors';

@Injectable()
export class DeleteMemberUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(memberId: string, groupId: string): Promise<Result<void, NotFoundError>> {
    const existing = await this.prisma.member.findFirst({
      where: { id: memberId, groupId },
    });
    if (!existing) return err(new NotFoundError('Member not found'));

    await this.prisma.member.update({
      where: { id: memberId },
      data: { active: false },
    });

    return ok(undefined);
  }
}
