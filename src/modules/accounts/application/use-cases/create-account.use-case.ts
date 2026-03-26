import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { Result, ok, err } from '@shared/result/result';
import { ConflictError } from '@shared/errors/domain.errors';
import { AccountDto } from '../queries/get-accounts.query';
import { AccountType } from '@prisma/client';

export interface CreateAccountAppDto {
  groupId: string;
  name: string;
  holder?: string;
  type?: AccountType;
  currency?: string;
}

@Injectable()
export class CreateAccountUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: CreateAccountAppDto): Promise<Result<AccountDto, ConflictError>> {
    const existing = await this.prisma.account.findUnique({
      where: { groupId_name: { groupId: dto.groupId, name: dto.name } },
    });
    if (existing) return err(new ConflictError(`Account "${dto.name}" already exists in this group`));

    const account = await this.prisma.account.create({
      data: {
        id: randomUUID(),
        groupId: dto.groupId,
        name: dto.name,
        holder: dto.holder,
        type: dto.type ?? 'CREDIT_CARD',
        currency: dto.currency ?? 'USD',
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
