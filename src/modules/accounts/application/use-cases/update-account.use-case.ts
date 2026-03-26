import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { Result, ok, err } from '@shared/result/result';
import { NotFoundError } from '@shared/errors/domain.errors';
import { AccountDto } from '../queries/get-accounts.query';

export interface UpdateAccountAppDto {
  accountId: string;
  groupId: string;
  name?: string;
  holder?: string;
  currency?: string;
}

@Injectable()
export class UpdateAccountUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: UpdateAccountAppDto): Promise<Result<AccountDto, NotFoundError>> {
    const existing = await this.prisma.account.findFirst({
      where: { id: dto.accountId, groupId: dto.groupId },
    });
    if (!existing) return err(new NotFoundError('Account not found'));

    const account = await this.prisma.account.update({
      where: { id: dto.accountId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.holder !== undefined && { holder: dto.holder }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
      },
    });

    return ok({
      id: account.id,
      groupId: account.groupId,
      name: account.name,
      holder: account.holder ?? undefined,
      type: account.type,
      currency: account.currency,
      active: account.active,
      createdAt: account.createdAt,
    });
  }
}
