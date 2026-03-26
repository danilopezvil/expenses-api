import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

export interface AccountDto {
  id: string;
  groupId: string;
  name: string;
  holder?: string;
  type: string;
  currency: string;
  active: boolean;
  createdAt: Date;
}

@Injectable()
export class GetAccountsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async execute(groupId: string): Promise<AccountDto[]> {
    const accounts = await this.prisma.account.findMany({
      where: { groupId, active: true },
      orderBy: { name: 'asc' },
    });

    return accounts.map((a) => ({
      id: a.id,
      groupId: a.groupId,
      name: a.name,
      holder: a.holder ?? undefined,
      type: a.type,
      currency: a.currency,
      active: a.active,
      createdAt: a.createdAt,
    }));
  }
}
