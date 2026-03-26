// TODO: Requires Account table in Prisma schema (post-migration).
// This stub satisfies DI wiring — all methods throw until the schema migration is applied.
import { Injectable } from '@nestjs/common';
import { IAccountRepository, AccountInfo } from '../../domain/ports/account-repository.port';

@Injectable()
export class AccountPrismaRepository implements IAccountRepository {
  async findById(_id: string): Promise<AccountInfo | null> {
    // TODO: implement after Account model is added to Prisma schema
    return null;
  }

  async findByGroupId(_groupId: string): Promise<AccountInfo[]> {
    // TODO: implement after Account model is added to Prisma schema
    return [];
  }
}
