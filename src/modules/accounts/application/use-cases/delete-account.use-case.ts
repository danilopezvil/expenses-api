import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { Result, ok, err } from '@shared/result/result';
import { NotFoundError } from '@shared/errors/domain.errors';

@Injectable()
export class DeleteAccountUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(accountId: string, groupId: string): Promise<Result<void, NotFoundError>> {
    const existing = await this.prisma.account.findFirst({
      where: { id: accountId, groupId },
    });
    if (!existing) return err(new NotFoundError('Account not found'));

    await this.prisma.account.update({
      where: { id: accountId },
      data: { active: false },
    });

    return ok(undefined);
  }
}
