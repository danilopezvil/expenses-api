import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { Result, ok, err } from '@shared/result/result';
import { NotFoundError } from '@shared/errors/domain.errors';

@Injectable()
export class DeleteGroupUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(groupId: string): Promise<Result<void, NotFoundError>> {
    const existing = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!existing) return err(new NotFoundError('Group not found'));

    await this.prisma.group.update({
      where: { id: groupId },
      data: { active: false },
    });

    return ok(undefined);
  }
}
