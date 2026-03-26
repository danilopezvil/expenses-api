import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { IAccountRepository, AccountInfo } from '../../domain/ports/account-repository.port';

@Injectable()
export class AccountPrismaRepository implements IAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AccountInfo | null> {
    const raw = await this.prisma.account.findUnique({ where: { id } });
    if (!raw) return null;
    return {
      id: raw.id,
      groupId: raw.groupId,
      name: raw.name,
      // memberId link does not exist in the Account model yet (post-migration TODO)
      memberId: undefined,
    };
  }

  async findByGroupId(groupId: string): Promise<AccountInfo[]> {
    const raws = await this.prisma.account.findMany({
      where: { groupId, active: true },
      orderBy: { name: 'asc' },
    });
    return raws.map((r) => ({
      id: r.id,
      groupId: r.groupId,
      name: r.name,
      memberId: undefined,
    }));
  }
}
