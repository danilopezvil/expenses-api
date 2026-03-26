// TODO: Requires ExpenseImport table in Prisma schema (post-migration).
// This stub satisfies DI wiring — save returns a placeholder record.
import { Injectable } from '@nestjs/common';
import { IImportsRepository, ImportRecord } from '../../domain/ports/imports-repository.port';
import { randomUUID } from 'crypto';

@Injectable()
export class ImportsPrismaRepository implements IImportsRepository {
  async save(record: Omit<ImportRecord, 'id' | 'importedAt'>): Promise<ImportRecord> {
    // TODO: persist to ExpenseImport table after Prisma migration
    return { ...record, id: randomUUID(), importedAt: new Date() };
  }
}
